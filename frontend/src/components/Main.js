import React from 'react'
import Intro from './Intro'
import About from './About'
import Events from './Events'
import News from './News'

const Main = ({data}) => {
  return (
    <>
        <Intro data={data.components.intro}/>
        <About data={data.components.about}/>
        <News news={data.news} />
        <Events events={data.events}/>

    </>
  )
}

export default Main
