import crypto from 'crypto'

export const HypenCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, (_, up) => up.toUpperCase())

export const RandomString = (length: number) => {
	return crypto.randomBytes(length).toString('ascii')
}
