import React from 'react'
import Intro from './Intro'
import About from './About'
import Events from './Events'

const Main = ({data}) => {
  return (
    <>
        <Intro data={data.components.intro}/>
        <About data={data.components.about}/>
        <Events events={data.events}/>
    </>
  )
}

export default Main
