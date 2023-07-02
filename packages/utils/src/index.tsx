import crypto from 'crypto'

export const HypenCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, (_, up) => up.toUpperCase())

export const RandomString = (length: number) =>
	crypto.randomBytes(length).toString('ascii')

export const RandomClassName = () => RandomString(6)
