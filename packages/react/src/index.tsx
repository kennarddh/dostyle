import { FC, JSX, ReactNode, Ref, createElement } from 'react'

type IValidConstantExpression = string | number
type IValidExpression<Props> =
	| IValidConstantExpression
	| ((props: Props) => IValidConstantExpression)

type HTMLElementName = keyof JSX.IntrinsicElements

type IInvalidProps = 'as' | 'ref'
interface IDefaultProps {
	as?: HTMLElementName
	ref?: Ref<HTMLElementName>
}

const HypenCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, (_, up) => up.toUpperCase())

const InterpolationFactory =
	(element: HTMLElementName) =>
	<
		Props extends Record<string | number | symbol, unknown> = Record<
			string,
			never
		>
	>(
		strings: TemplateStringsArray,
		...expressions: IValidExpression<
			Omit<Props, IInvalidProps> & Omit<IDefaultProps, 'ref'>
		>[]
	) => {
		const Component: FC<
			Props & IDefaultProps & { children: ReactNode[] | ReactNode }
		> = ({ children, ...props }) => {
			const typedProps = props as Props & IDefaultProps

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
				HypenCaseToCamelCase(rule[0].toLowerCase()),
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

type Interpolation = ReturnType<typeof InterpolationFactory>

type IStyled = Record<HTMLElementName, Interpolation>

const styled = new Proxy<IStyled>({} as IStyled, {
	get(_, prop: HTMLElementName, __) {
		return InterpolationFactory(prop)
	},
})

export default styled
