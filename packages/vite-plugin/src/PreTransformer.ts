/* eslint-disable security/detect-object-injection */
import { PluginObj } from '@babel/core'

const PreTransformer = (virtualModuleId: string) => (): PluginObj => {
	return {
		name: 'dostyle:pretransform',
		visitor: {
			ImportDeclaration(path) {
				if (path.isImportDeclaration()) {
					if (path.node.source.value === '@dostyle/react') {
						path.node.source.value = virtualModuleId
					}
				}
			},
		},
	}
}

export default PreTransformer
