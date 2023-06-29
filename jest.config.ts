import type { Config } from 'jest'

const config: Config = {
	testEnvironment: 'jsdom',
	coveragePathIgnorePatterns: ['/node_modules/'],
	collectCoverageFrom: ['./src/**'],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	clearMocks: true,
	moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
}

export default config
