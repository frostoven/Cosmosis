import fs from 'fs';
import React from 'react';
import CosmosisPlugin from '../../types/CosmosisPlugin';

class PostBootChecks {
  constructor() {
    this.ensureProdAssetsExist();
  }

  ensureProdAssetsExist() {
    fs.stat('./prodHqAssets', (error) => {
      if (error) {
        window.$modal.alert({
          header: 'Assets Incomplete',
          body: (
            <div>
              The high-quality assets pack is missing; you'll only see
              basic assets, and no stars will be visible.
              <br/><br/>
              Please download the "Stand-Alone Production Assets" pack from
              the Cosmosis page, which contains all HQ assets:
              <ul>
                <li>
                  <a
                    href="#"
                    onClick={() => {
                      // @ts-ignore - nw is valid.
                      nw.Shell.openExternal('https://github.com/frostoven/Cosmosis/releases');
                    }}
                  >
                    github.com/frostoven/Cosmosis/releases
                  </a>
                </li>
              </ul>
            </div>
          ),
        });
      }
    });
  }
}

const postBootChecksPlugin = new CosmosisPlugin(
  'postBootChecks', PostBootChecks,
);

export {
  PostBootChecks,
  postBootChecksPlugin,
};
