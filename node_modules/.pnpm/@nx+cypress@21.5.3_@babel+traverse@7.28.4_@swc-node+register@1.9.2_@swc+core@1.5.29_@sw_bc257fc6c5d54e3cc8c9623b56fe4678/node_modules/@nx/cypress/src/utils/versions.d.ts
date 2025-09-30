import { type Tree } from '@nx/devkit';
export declare const nxVersion: any;
export declare const eslintPluginCypressVersion = "^3.5.0";
export declare const typesNodeVersion = "20.19.9";
export declare const cypressViteDevServerVersion = "^6.0.3";
export declare const cypressVersion = "^14.2.1";
export declare const cypressWebpackVersion = "^4.0.2";
export declare const viteVersion = "^6.0.0";
export declare const htmlWebpackPluginVersion = "^5.5.0";
export declare function versions(tree: Tree): Omit<typeof import("./versions"), "versions" | "getInstalledCypressVersion" | "getInstalledCypressMajorVersion" | "assertMinimumCypressVersion"> | {
    nxVersion: any;
    eslintPluginCypressVersion: string;
    typesNodeVersion: string;
    cypressViteDevServerVersion: string;
    cypressVersion: string;
    cypressWebpackVersion: string;
    viteVersion: string;
    htmlWebpackPluginVersion: string;
};
export declare function getInstalledCypressVersion(tree?: Tree): string | null;
export declare function getInstalledCypressMajorVersion(tree?: Tree): number | null;
export declare function assertMinimumCypressVersion(minVersion: number, tree?: Tree): void;
//# sourceMappingURL=versions.d.ts.map