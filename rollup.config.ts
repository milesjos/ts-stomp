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

    external: [
        'rxjs/Observable',
        'rxjs/Subject',
        'rxjs/ReplaySubject',
        'rxjs/Subscription'
    ] ,

    globals: {
        'rxjs/Observable': 'Rx',
        'rxjs/Subject': 'Rx',
        'rxjs/ReplaySubject': 'Rx',
        'rxjs/Subscription': 'Rx'
    },

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
        resolve(),

        // Resolve source maps to the original source
        sourceMaps()
    ],
}
