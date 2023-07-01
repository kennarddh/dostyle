import { FC } from 'react'

import styled from '@dostyle/react'

const Container = styled.div<{ width: number }>`
	background-color: blue;
	width: ${({ width }) => width}px;
`

const Text = styled.p<{ color: string }>`
	color: ${props => props.color};
`

const App: FC = () => {
	return (
		<Container
			as='section'
			width={200}
			onClick={() => console.log('Container clicked')}
		>
			<Text color='red'>1</Text>
			<Text color='yellow'>2</Text>
		</Container>
	)
}

export default App
