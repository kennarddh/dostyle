import { FC, JSX, RefObject, createElement, forwardRef } from 'react'

import { HypenCaseToCamelCase } from '@dostyle/utils'

type IValidConstantExpression = string | number
type IValidExpression<Props> =
	| IValidConstantExpression
	| ((props: Props) => IValidConstantExpression)

type IHTMLElementName = keyof JSX.IntrinsicElements

type IInvalidProps = 'as' | 'ref'
interface IDefaultProps<Element extends IHTMLElementName> {
	as?: IHTMLElementName
	ref?: RefObject<GetHtmlElementFromName<Element>>
}

type IUserProps = Record<string | number | symbol, NonNullable<unknown>>

type IProps<
	Element extends IHTMLElementName,
	UserProps extends IUserProps
> = Omit<UserProps, IInvalidProps> &
	IDefaultProps<Element> &
	JSX.IntrinsicElements[Element]

type IComponentProps<
	Element extends IHTMLElementName,
	UserProps extends IUserProps
> = IProps<Element, UserProps>

type IComponent<Element extends IHTMLElementName> = <
	UserProps extends IUserProps = Record<string, NonNullable<unknown>>
>(
	strings: TemplateStringsArray,
	...expressions: IValidExpression<Omit<IProps<Element, UserProps>, 'ref'>>[]
) => FC<IComponentProps<Element, UserProps>>

type GetHtmlElementFromName<Element extends IHTMLElementName> = NonNullable<
	Exclude<
		NonNullable<
			Exclude<NonNullable<JSX.IntrinsicElements[Element]['ref']>, string>
		>,
		(...args: any[]) => any // eslint-disable-line @typescript-eslint/no-explicit-any
	>['current']
>

// as props is not used as element type
const ComponentFactory =
	<Element extends IHTMLElementName>(element: Element) =>
	<UserProps extends IUserProps = Record<string, NonNullable<unknown>>>(
		strings: TemplateStringsArray,
		...expressions: IValidExpression<
			Omit<IProps<Element, UserProps>, 'ref'>
		>[]
	) => {
		const Component = forwardRef<
			GetHtmlElementFromName<Element>,
			IComponentProps<Element, UserProps>
		>(({ children, ...props }, ref) => {
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
		})

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
