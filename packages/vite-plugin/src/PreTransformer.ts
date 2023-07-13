/* eslint-disable security/detect-object-injection */
import { PluginObj } from '@babel/core'

const PreTransformer = () => (): PluginObj => {
	return {
		name: 'dostyle:pretransform',
		visitor: {
			ImportDeclaration(path) {
				if (path.isImportDeclaration()) {
					if (path.node.source.value === '@dostyle/react') {
						path.node.source.value = 'virtual:do-style-react'
					}
				}
			},
		},
	}
}

export default PreTransformer
