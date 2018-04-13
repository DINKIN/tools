/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as logging from 'plylog';
import Generator = require('yeoman-generator');

import {Github} from '../github/github';

const logger = logging.getLogger('cli.init');

export interface GithubGeneratorOptions {
  githubToken?: string;
  owner: string;
  repo: string;
  semverRange?: string;
  branch?: string;
}

export function createGithubGenerator(githubOptions: GithubGeneratorOptions):
    (typeof Generator) {
  const githubToken = githubOptions.githubToken;
  const owner = githubOptions.owner;
  const repo = githubOptions.repo;
  const semverRange = githubOptions.semverRange || '*';
  const branch = githubOptions.branch;

  return class GithubGenerator extends Generator {
    _github: Github;

    constructor(args: string|string[], options: {}|null|undefined) {
      super(args, options);
      this._github = new Github({owner, repo, githubToken});
    }

    // This is necessary to prevent an exception in Yeoman when creating
    // storage for generators registered as a stub and used in a folder
    // with a package.json but with no name property.
    // https://github.com/Polymer/polymer-cli/issues/186
    rootGeneratorName(): string {
      return 'GithubGenerator';
    }

    async _writing() {
      let codeSource;

      if (branch === undefined) {
        logger.info(
          (semverRange === '*') ?
              `Finding latest release of ${owner}/${repo}` :
              `Finding latest ${semverRange} release of ${owner}/${repo}`);
        codeSource = await this._github.getSemverRelease(semverRange);
      } else {
        codeSource = await this._github.getBranch(branch);
      }

      logger.info(`Downloading ${codeSource.name} of ${owner}/${repo}`);
      await this._github.extractReleaseTarball(
          codeSource.tarball_url, this.destinationRoot());
      this._github.removeUnwantedFiles(this.destinationRoot());
    }

    async writing(): Promise<void> {
      const done = this.async();
      this._writing().then(() => done(), (err) => done(err));
    }

    install() {
      this.installDependencies();
    }
  };
}
