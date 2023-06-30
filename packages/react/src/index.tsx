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

const InterpolationFactory =
	(element: HTMLElementName) =>
	<Props extends Omit<IDefaultProps, 'ref'>>(
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

			// Interpolation
			const parsedExpressions = expressions.map(expression =>
				typeof expression === 'function'
					? expression(typedProps)
					: expression
			)

			const cssString = String.raw({ raw: strings }, ...parsedExpressions)

			console.log({ cssString })

			const parsedChildren = Array.isArray(children)
				? children
				: [children]

			return createElement(
				element,
				{
					className: 'greeting',
				},
				...parsedChildren
			)
		}

		return Component
	}

const styled = {
	div: InterpolationFactory('div'),
}

export default styled
