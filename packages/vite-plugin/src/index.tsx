import { Plugin } from 'vite'

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

			console.log(id, src)
		},
	}
}

export default DoStyle
