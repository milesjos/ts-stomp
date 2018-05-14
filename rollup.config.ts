import resolve from 'rollup-plugin-node-resolve'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from 'rollup-plugin-typescript2'


const pkg = require('./package.json');

const libraryName = 'ts-stomp';


export default {

    input: `dist/lib/${libraryName}.js`,
    output: [
        {
            file: pkg.main,
            name: camelCase(libraryName),
            format: 'umd',
            sourcemap: true
        },
        {
            file: pkg.module,
            format: 'es',
            sourcemap: true,
        }
    ],

    /*
    globals: {
        'rxjs/Observable': 'Rx',
        'rxjs/Subject': 'Rx',
        'rxjs/ReplaySubject': 'Rx',
        'rxjs/Subscription': 'Rx'
    },*/

    watch: {
        include: 'src/**',
    },

    plugins: [

        // Compile TypeScript files
        typescript(),

        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        // commonjs(),

        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve({
            // use "module" field for ES6 module if possible
            module: true, // Default: true

            // use "jsnext:main" if possible
            // – see https://github.com/rollup/rollup/wiki/jsnext:main
            jsnext: true,  // Default: false

            // use "main" field or index.js, even if it's not an ES6 module
            // (needs to be converted from CommonJS to ES6
            // – see https://github.com/rollup/rollup-plugin-commonjs
            main: true,  // Default: true

            // some package.json files have a `browser` field which
            // specifies alternative files to load for people bundling
            // for the browser. If that's you, use this option, otherwise
            // pkg.browser will be ignored
            browser: true,  // Default: false

            // whether to prefer built-in modules (e.g. `fs`, `path`) or
            // local ones with the same names
            preferBuiltins: false,  // Default: true

            // Lock the module search in this path (like a chroot). Module defined
            // outside this path will be marked as external
            jail: '/', // Default: '/'

            // If true, inspect resolved files to check that they are
            // ES2015 modules
            modulesOnly: true, // Default: false
        }),

        // Resolve source maps to the original source
        sourceMaps()
    ],
}
