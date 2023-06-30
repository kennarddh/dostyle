import { FC } from 'react'

import styled from '@dostyle/react'

const Container = styled.div`
	background-color: blue;
`

const App: FC = () => {
	return <Container>
		<p>1</p>
		<p>2</p>
	</Container>
}

export default App
