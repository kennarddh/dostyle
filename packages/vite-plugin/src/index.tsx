import { Plugin } from 'vite'

import { transformSync } from '@babel/core'
import path from 'path'

export interface IDoStyleParameters {
	extensions?: string[]
}

const DoStyle = ({
	extensions = ['jsx', 'tsx'],
}: IDoStyleParameters = {}): Plugin => {
	return {
		name: 'do-style',
		enforce: 'pre',
		transform(src, id) {
			if (!extensions.some(ext => id.endsWith(ext))) return

			console.log(path)

			const result = transformSync(src, {
				configFile: false,
				filename: id,
				presets: ['@babel/preset-typescript'],
				plugins: [''],
			}) // => { code, map, ast }
			console.log(result?.code)
		},
	}
}

export default DoStyle
