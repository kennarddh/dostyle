import { FC, JSX, ReactNode, Ref, createElement } from 'react'

type IValidConstantExpression = string | number
type IValidExpression<Props> =
	| IValidConstantExpression
	| ((props: Props) => IValidConstantExpression)

type HTMLElementName = keyof JSX.IntrinsicElements

type IInvalidProps = 'as' | 'ref'
interface IDefaultProps extends Record<string | number | symbol, unknown> {
	as?: HTMLElementName
	ref?: Ref<HTMLElementName>
}

const HypenCashToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, (_, up) => up.toUpperCase())

const InterpolationFactory =
	<Props extends IDefaultProps = IDefaultProps>(element: HTMLElementName) =>
	(
		strings: TemplateStringsArray,
		...expressions: IValidExpression<
			Omit<Props & IDefaultProps, IInvalidProps>
		>[]
	) => {
		const Component: FC<Props & { children: ReactNode[] | ReactNode }> = ({
			children,
			...props
		}) => {
			const typedProps = props as unknown as Props

			const parsedExpressions = expressions.map(expression =>
				typeof expression === 'function'
					? expression(typedProps)
					: expression
			)

			const cssString = String.raw({ raw: strings }, ...parsedExpressions)

			const rules = cssString
				.trim()
				.split(';')
				.filter(rule => rule !== '')
				.map(rule =>
					rule
						.trim()
						.split(':')
						.map(part => part.trim())
				)

			const camelCasedRules = rules.map(rule => [
				HypenCashToCamelCase(rule[0].toLowerCase()),
				rule[1],
			])

			const style = Object.fromEntries(camelCasedRules)

			const parsedChildren = Array.isArray(children)
				? children
				: [children]

			return createElement(
				typedProps.as ?? element,
				{
					style,
				},
				...parsedChildren
			)
		}

		Component.displayName = 'Display'

		return Component
	}

const styled = {
	div: InterpolationFactory('div'),
}

export default styled
