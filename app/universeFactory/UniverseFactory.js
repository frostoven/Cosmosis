/**
 * How this works:
 *
 * The not immediately intuitive part about visualising these stars is that
 * they're reasoned about not by distance, but by luminosity. This is because
 * you can have a star 4ly away that's not visible (Proxima Centauri), yet have
 * a star 1200ly away that brighter than most other stars (Alnitak, Orion's
 * Belt).
 *
 * We have two groups we need to work with: real stars, and procedural
 * stars. Dealing with procedural stars are easy: generate all the
 * brightest visible stars in the entire galaxy (there are very few).
 * Generate less luminous nearby stars, then even less luminous close
 * stars. Only generate non-visible stars while panning a trip in a galaxy map,
 * and do that only for a small area. It's all math that will eventually work
 * with enough tweaking.
 *
 * We cannot however know implicitly if a real star will be visible - we
 * first need to read its data. The strategy this application employs is as
 * follows: read basic star data (luminosity and distance). If it falls
 * within visual range, query additional data about that star. This will be
 * done via specially prepared padded JSON buffered reads. This hopefully
 * allows us to squeeze 2 million real stars into RAM with no issues. The hope
 * is that we only use around 250MB RAM, or 700MB RAM worst-case scenario.
 *
 * Remember that part where I said procedural stars are easy? I lied. Once we
 * have some stuff going we need to prevent the procedural engine from
 * providing stars at locations where we already have real stars. The overall
 * 'feel' should be that real star data naturally flows into the procedural
 * star domains such that it generally matches statistical stellar models.
 *
 * Now, there is one exception to the "distance is not important" argument -
 * optimisation via skybox. If anything is over a certain range, then it
 * 'stops' moving relative to you at high speeds. It therefore probably belongs
 * in the skybox instead. If it's very close (say, 50ly), then it often makes
 * sense to render it as a real object and remove it from the skybox. This
 * makes star-hop renders easier, and reduces the frequency at which the skybox
 * needs to be regenerated. You can easily render 10,000 stars on weak g.cards
 * with no lag, which, for reference, is more stars than you can see with the
 * naked eye from Earth. This means that the few hundreds we render as real
 * objects should play nicely with the thousands we place in the skybox.
 */

import { Vector3 } from 'three';
import {
  calculateBrightness,
  distanceTo,
  INVISIBLY_DIM_FROM_EARTH,
} from './astrometrics';
import Unit from '../local/Unit';
import { sinRng } from '../local/seededRng';

/**
 * Generates JSON. Does not generates meshes, geo, etc.
 *
 * This class expects you to dump all the real star data you have into it. This
 * means that the real star data needs to be concise; you can't have each star
 * contain, for example, all known names. The application won't be able to
 * handle that. Instead, we'll add buffered catalogs to query for such extra
 * data as it's needed.
 */
export default class UniverseFactory {
  // Being dead-center breaks some math rules, so we need to be aware of it.
  static SOL = -99;

  constructor(props) {
    // Current x,y,z position. Units are in parsecs.
    this.currentPosition = new Vector3(0, 0, 0); // <- 0,0,0 is Sol's position.
    /**@type {*[][]}*/
    this.realStarData = [];
  }

  // Used to add data that is not procedural (such as those from real star
  // catalogs). Accepts the (3D) format presented by this repo:
  // https://github.com/frostoven/BSC5P-JSON-XYZ
  addStarData(array) {
    if (!Array.isArray(array)) {
      throw 'addStarData only accepts arrays of objects.';
    }
    this.realStarData.push(array);
  }

  getVisibleCatalogStars({ x, y, z , distanceLimit=Infinity, outResults}) {
    const stars = outResults.stars;
    let tooDim = 0;
    let willDisplay = 0;
    // A note on the structure here: I'm micro-optimising. Nested variables
    // reduce performance by really, really small amount, so we keep nesting
    // to a minimum. That's also why len is defined: it prevents looking up
    // the array length each time, but could cause concurrency issues if the
    // dataset size was changed at some point as part of an async operation.
    const realStars = this.realStarData;
    for (let d = 0, dLen = realStars.length; d < dLen; d++) {
      // Loop through each catalog.
      const catalog = realStars[d];
      for (let i = 0, len = catalog.length; i < len; i++) {
        const star = catalog[i];
        // console.log(`distance from Earth to ${star.n}:`, distanceTo({ x, y, z }, { x: star.x, y: star.y, z: star.z }));
        const distance = distanceTo({ x, y, z }, { x: star.x, y: star.y, z: star.z }) * Unit.parsec.inMeters;
        star.m = distance; // meters

        // TODO: MAKE REMAINDER INTO FUNCTION
        const energy = calculateBrightness(star.N, distance);
        if (energy < INVISIBLY_DIM_FROM_EARTH) {
          console.log(star.n, `is too dim to be displayed: ${energy} < ${INVISIBLY_DIM_FROM_EARTH}`);
          tooDim++;
        }
        else {
          // console.log('Will display:', star, '->', energy);
          willDisplay++;
          stars.push(star);
        }

        if (distance < outResults.nearestStar.distanceMeters) {
          // TODO: check if assigning outResults.nearestStar is faster.
          outResults.nearestStar = star;
          outResults.nearestStarIndex = outResults.stars.length - 1;
        }
      }
    }

    console.log('--> [getVisibleCatalogStars: real]', { tooDim, willDisplay });
  }

  getVisibleProceduralStars({ x, y, z , distanceLimit=Infinity, outResults}) {
    let tooDim = 0;
    let willDisplay = 0;
    const stars = outResults.stars;
    const rng = sinRng(42); // TODO: change according to local block location. Maybe floor x,y,z.
    for (let i = 0, len = 3; i < len; i++) {
      const star = {
        i: 'seeded' + i, // manual. note: this star's data is an educational guess.
        n: 'SCS ' + i, // Stellar Cartography System. TODO: make the number loop independent - should be based on galactic area.
        x: sinRng() * 10,
        y: sinRng() * 10,
        z: sinRng() * 10,
        N: sinRng(),
        K: { r: 1.000, g: sinRng(), b: sinRng() },
      };
      const distance = distanceTo({ x, y, z }, { x: star.x, y: star.y, z: star.z }) * Unit.parsec.inMeters;
      star.m = distance;

      // TODO: MAKE REMAINDER INTO FUNCTION
      const energy = calculateBrightness(star.N, distance);
      if (energy < INVISIBLY_DIM_FROM_EARTH) {
        console.log(star.n, `is too dim to be displayed: ${energy} < ${INVISIBLY_DIM_FROM_EARTH}`);
        tooDim++;
      }
      else {
        // console.log('Will display:', star, '->', energy);
        willDisplay++;
        stars.push(star);
      }

      if (distance < outResults.nearestStar.distanceMeters) {
        // TODO: check if assigning outResults.nearestStar is faster.
        outResults.nearestStar = star;
        outResults.nearestStarIndex = outResults.stars.length - 1;
      }
    }

    console.log('--> [getVisibleCatalogStars: procedural]', { tooDim, willDisplay });
  }

  // Returns all stars visible from the current location.
  getVisibleStars({ x, y, z , distanceLimit=Infinity}) {
    const data = {
      stars: [],
      nearestStar: { n: 'The Eye of Terror', distanceMeters: Infinity },
      nearestStarIndex: -1,
    };
    this.getVisibleCatalogStars({ x, y, z , distanceLimit, outResults: data });
    this.getVisibleProceduralStars({ x, y, z , distanceLimit, outResults: data });

    // TODO: once we get the basics of travel done, we can ease into the
    //  procedural stars by reducing the changes of a random gen close to
    //  0,0,0. We can also gradually reduce luminosity nearer to 0,0,0 to
    //  prevent accidentally making artificial stars visible from earth.
    return data;
  }
}
