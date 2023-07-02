import babelCore from '@babel/core'

const Transformer = (babel: typeof babelCore) => {
	return {
		name: 'remove-debugger-plugin', // this is optional
		visitor: {},
	}
}

export default Transformer
