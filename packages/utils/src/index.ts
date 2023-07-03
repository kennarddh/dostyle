export const HypenCaseToCamelCase = (str: string) =>
	str
		.split('-')
		.map(part => `${part[0].toUpperCase()}${part.slice(0)}`)
		.join('')

export const DecimalToHex = (decimal: number) =>
	decimal.toString(16).padStart(2, '0')

// https://stackoverflow.com/a/1349426/14813577
export const RandomString = (length: number) => {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	let counter = 0
	let result = ''

	while (counter < length) {
		result += characters.charAt(
			Math.floor(Math.random() * characters.length)
		)

		counter += 1
	}

	return result
}

export const RandomClassName = () => RandomString(6)
