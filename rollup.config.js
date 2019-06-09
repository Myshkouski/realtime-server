import babel from 'rollup-plugin-babel'
import clear from 'rollup-plugin-delete'

const external = (id, parentId, isResolved) => {
    if (parentId) {
        if (isResolved) {
            // console.log(/node_modules/.test(id), id)
            return /node_modules/.test(id)
        }

        // console.log(/^[^.]/.test(id), id)
        return /^[^.]/.test(id)
    }

    // console.log(false, id)
    return false
}

const __dist = 'dist'

export default [
    {
        input: {
            index: 'src/index.js',
            context: 'src/context/index.js'
        },
        output: [
            // {
            //     format: 'esm',
            //     dir: `${ __dist }/esm`,
            //     entryFileNames: '[name].mjs',
            //     chunkFileNames: 'chunks/[hash].mjs',
            //     preferConst: true
            // }, 
            {
                format: 'cjs',
                dir: `${ __dist }/cjs`,
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[hash].js',
                preferConst: true
            }],
        external,
        plugins: [
            clear({
                targets: [`${ __dist }/*`]
            }),
            babel({
                "plugins": [
                    ["@babel/plugin-proposal-decorators", {
                        decoratorsBeforeExport: true
                    }]
                ]
            })
        ]
    }
]
