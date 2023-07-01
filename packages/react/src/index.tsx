import { FC, JSX, ReactNode, Ref, createElement } from 'react'

import { HypenCaseToCamelCase } from '@dostyle/utils'

type IValidConstantExpression = string | number
type IValidExpression<Props> =
	| IValidConstantExpression
	| ((props: Props) => IValidConstantExpression)

type IHTMLElementName = keyof JSX.IntrinsicElements

type IInvalidProps = 'as' | 'ref'
interface IDefaultProps {
	as?: IHTMLElementName
	ref?: Ref<IHTMLElementName>
}

type IUserProps = Record<string | number | symbol, unknown>

type IProps<
	Element extends IHTMLElementName,
	UserProps extends IUserProps
> = Omit<UserProps, IInvalidProps> &
	IDefaultProps &
	JSX.IntrinsicElements[Element]

type IChildren = ReactNode[] | ReactNode

type IComponentProps<
	Element extends IHTMLElementName,
	UserProps extends IUserProps
> = IProps<Element, UserProps> & { children: IChildren }

type IComponent<Element extends IHTMLElementName> = <
	UserProps extends IUserProps = Record<string, never>
>(
	strings: TemplateStringsArray,
	...expressions: IValidExpression<Omit<IProps<Element, UserProps>, 'ref'>>[]
) => FC<IComponentProps<Element, UserProps>>

const ComponentFactory =
	<Element extends IHTMLElementName>(element: Element) =>
	<UserProps extends IUserProps = Record<string, unknown>>(
		strings: TemplateStringsArray,
		...expressions: IValidExpression<
			Omit<IProps<Element, UserProps>, 'ref'>
		>[]
	) => {
		const Component: FC<IComponentProps<Element, UserProps>> = ({
			children,
			ref,
			...props
		}) => {
			const parsedExpressions: IValidConstantExpression[] = []

			for (const expression of expressions) {
				if (typeof expression === 'function')
					parsedExpressions.push(
						expression(
							props as Omit<IProps<Element, UserProps>, 'ref'>
						)
					)
				else parsedExpressions.push(expression)
			}

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
				props.as ?? element,
				{
					style,
					ref,
					...props,
				},
				...parsedChildren
			)
		}

		Component.displayName = 'Display'

		return Component
	}

type IStyled = {
	readonly [Element in IHTMLElementName]: IComponent<Element>
}

const styled = new Proxy<IStyled>({} as IStyled, {
	get(_, prop: IHTMLElementName) {
		return ComponentFactory(prop)
	},
})

export default styled
