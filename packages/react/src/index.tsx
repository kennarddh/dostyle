import {
	ForwardRefExoticComponent,
	JSX,
	PropsWithoutRef,
	RefAttributes,
	createElement,
	forwardRef,
} from 'react'

type IValidConstantExpression = string | number
type IValidExpression<Props> =
	| IValidConstantExpression
	| ((props: Props) => IValidConstantExpression)

type IHTMLElementName = keyof JSX.IntrinsicElements

type IInvalidProps = 'as'
interface IDefaultProps {
	as?: IHTMLElementName
}

type IUserProps = Record<string | number | symbol, NonNullable<unknown>>

type IProps<
	Element extends IHTMLElementName,
	UserProps extends IUserProps
> = Omit<UserProps, IInvalidProps> &
	IDefaultProps &
	JSX.IntrinsicElements[Element]

type IComponentProps<
	Element extends IHTMLElementName,
	UserProps extends IUserProps
> = IProps<Element, UserProps>

type IComponent<Element extends IHTMLElementName> = <
	UserProps extends IUserProps = Record<string, NonNullable<unknown>>
>(
	strings: TemplateStringsArray,
	...expressions: IValidExpression<IProps<Element, UserProps>>[]
) => ForwardRefExoticComponent<
	PropsWithoutRef<IComponentProps<Element, UserProps>> &
		RefAttributes<GetHtmlElementFromName<Element>>
>

type GetHtmlElementFromName<Element extends IHTMLElementName> = NonNullable<
	Exclude<
		NonNullable<
			Exclude<NonNullable<JSX.IntrinsicElements[Element]['ref']>, string>
		>,
		(...args: any[]) => any // eslint-disable-line @typescript-eslint/no-explicit-any
	>['current']
>

export const HypenCaseToCamelCase = (str: string) =>
	str
		.split('-')
		.map(part => `${part[0].toUpperCase()}${part.slice(0)}`)
		.join('')

// as props is not used as element type
const ComponentFactory =
	<Element extends IHTMLElementName>(element: Element): IComponent<Element> =>
	<UserProps extends IUserProps = Record<string, NonNullable<unknown>>>(
		strings: TemplateStringsArray,
		...expressions: IValidExpression<IProps<Element, UserProps>>[]
	) => {
		const Component = forwardRef<
			GetHtmlElementFromName<Element>,
			IComponentProps<Element, UserProps>
		>(({ children, ...props }, ref) => {
			const parsedExpressions: IValidConstantExpression[] = []

			for (const expression of expressions) {
				if (typeof expression === 'function')
					parsedExpressions.push(
						expression(props as IProps<Element, UserProps>)
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
