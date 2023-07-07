import React from 'react'

import styled from '@dostyle/react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './Styles.css'

export const ComponentSubTitle = styled.h2`
	color: red;
`

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)
