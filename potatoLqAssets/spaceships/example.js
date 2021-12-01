// TODO: a visual representation of this may make more sense. Create youtube
//  video showing each feature.

module.exports = {
    // Conditions that cause full cabin depressurisation.
    fullCabinDepressurisation: [
        { simultaneousOpenDoors: [ 'door1', 'door2' ] },

        // If 2 different doors can independently cause depressurisation,
        // then simply split them into 2 lines:
        // { simultaneousOpenDoors: [ 'door2' ] },
        // { simultaneousOpenDoors: [ 'door1' ] },
    ],
    // Conditions where only the players experiences depressurisation (only
    // triggers if fullCabinDepressurisation has not already happened).
    localDepressurisation: [
        { simultaneousOpenDoors: ['door2'] }
    ]
}
