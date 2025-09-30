"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlWebpackPluginVersion = exports.viteVersion = exports.cypressWebpackVersion = exports.cypressVersion = exports.cypressViteDevServerVersion = exports.typesNodeVersion = exports.eslintPluginCypressVersion = exports.nxVersion = void 0;
exports.versions = versions;
exports.getInstalledCypressVersion = getInstalledCypressVersion;
exports.getInstalledCypressMajorVersion = getInstalledCypressMajorVersion;
exports.assertMinimumCypressVersion = assertMinimumCypressVersion;
const devkit_1 = require("@nx/devkit");
const semver_1 = require("semver");
exports.nxVersion = require('../../package.json').version;
exports.eslintPluginCypressVersion = '^3.5.0';
exports.typesNodeVersion = '20.19.9';
exports.cypressViteDevServerVersion = '^6.0.3';
exports.cypressVersion = '^14.2.1';
exports.cypressWebpackVersion = '^4.0.2';
exports.viteVersion = '^6.0.0';
exports.htmlWebpackPluginVersion = '^5.5.0';
const latestVersions = {
    nxVersion: exports.nxVersion,
    eslintPluginCypressVersion: exports.eslintPluginCypressVersion,
    typesNodeVersion: exports.typesNodeVersion,
    cypressViteDevServerVersion: exports.cypressViteDevServerVersion,
    cypressVersion: exports.cypressVersion,
    cypressWebpackVersion: exports.cypressWebpackVersion,
    viteVersion: exports.viteVersion,
    htmlWebpackPluginVersion: exports.htmlWebpackPluginVersion,
};
function versions(tree) {
    const installedCypressVersion = getInstalledCypressVersion(tree);
    if (!installedCypressVersion) {
        return latestVersions;
    }
    const cypressMajorVersion = (0, semver_1.major)(installedCypressVersion);
    if (cypressMajorVersion === 14) {
        return latestVersions;
    }
    if (cypressMajorVersion > 14) {
        throw new Error(`You're currently using an unsupported Cypress version: ${installedCypressVersion}. Supported versions are v13 and v14.`);
    }
    return {
        nxVersion: exports.nxVersion,
        eslintPluginCypressVersion: '^3.5.0',
        typesNodeVersion: '20.19.9',
        cypressViteDevServerVersion: '^2.2.1',
        cypressVersion: '^13.13.0',
        cypressWebpackVersion: '^3.8.0',
        viteVersion: '~5.0.0',
        htmlWebpackPluginVersion: '^5.5.0',
    };
}
function getInstalledCypressVersion(tree) {
    try {
        let version;
        if (tree) {
            version = getCypressVersionFromTree(tree);
        }
        else {
            version = getCypressVersionFromFileSystem();
        }
        return version;
    }
    catch {
        return null;
    }
}
function getInstalledCypressMajorVersion(tree) {
    const installedCypressVersion = getInstalledCypressVersion(tree);
    return installedCypressVersion ? (0, semver_1.major)(installedCypressVersion) : null;
}
function assertMinimumCypressVersion(minVersion, tree) {
    const version = getInstalledCypressMajorVersion(tree);
    if (version && version < minVersion) {
        throw new Error(`Cypress version of ${minVersion} or higher is not installed. Expected Cypress v${minVersion}+, found Cypress v${version} instead.`);
    }
}
function getCypressVersionFromTree(tree) {
    const packageJson = (0, devkit_1.readJson)(tree, 'package.json');
    const installedVersion = packageJson.devDependencies?.cypress ?? packageJson.dependencies?.cypress;
    if (!installedVersion) {
        return null;
    }
    if (installedVersion === 'latest' || installedVersion === 'next') {
        return (0, semver_1.clean)(exports.cypressVersion) ?? (0, semver_1.coerce)(exports.cypressVersion)?.version;
    }
    return (0, semver_1.clean)(installedVersion) ?? (0, semver_1.coerce)(installedVersion)?.version;
}
function getCypressVersionFromFileSystem() {
    let packageJson;
    try {
        packageJson = require('cypress/package.json');
    }
    catch { }
    if (!packageJson) {
        return null;
    }
    return packageJson.version;
}
