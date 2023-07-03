import { FC, useRef } from 'react'

import styled from '@dostyle/react'

const Container = styled.div<{ width: number }>`
	background-color: blue;
	width: ${({ width }) => width}px;
`

const Text = styled.p<{ color: string }>`
	color: ${props => props.color};
`

const Input = styled.input``

const App: FC = () => {
	const ContainerRef = useRef<HTMLDivElement>(null)

	console.log({ ContainerRef })

	return (
		<Container
			as='section'
			width={200}
			onClick={() => console.log('Container clicked')}
			className='original-class'
			// ref={ContainerRef}
		>
			<Text color='red'>1</Text>
			<Text color='yellow'>2</Text>
			<Input placeholder='Input' />
		</Container>
	)
}

export default App
