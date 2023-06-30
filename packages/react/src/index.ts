import { JSX, Ref } from 'react'

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

const InterpolationFactory =
	(element: HTMLElementName) =>
	<Props extends Record<string | number | symbol, unknown>>(
		strings: TemplateStringsArray,
		...expressions: IValidExpression<
			Omit<Props & IDefaultProps, IInvalidProps>
		>[]
	) => {
		// Interpolation
	}

const styled = {
	div: InterpolationFactory('div'),
}

export default styled
