import { FC } from 'react'

import styled from '@dostyle/react'

const Container = styled.div<{ color: string; width: number }>`
	background-color: blue;
	color: ${props => props.color};
	width: ${({ width }) => width}px;
`

const App: FC = () => {
	return (
		<Container as='section' color='red' width={200}>
			<p>1</p>
			<p>2</p>
		</Container>
	)
}

export default App
