import {useState, useEffect} from 'react'
import './App.css';
import {generateNasheed} from './generateNasheed.js'
import Modal from './Modal.js'
import Header from './Header.js'
import NasheedBoard from './NasheedBoard.js'

function App() {
  const [nasheeds, setNasheeds] = useState([])
  const [nasheedId, setNasheedId] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    generateNasheed().then(({nasheed}) => {
      setNasheeds(nasheed)
    })
  } ,[])
  
  const handleClick = index => () => {
    setNasheedId(index);
    setIsOpen(true);
    
  }
  const handleClose = () => {
    setIsOpen(false);    
  }
  return (
    <div className="App">
      <Header />
      <NasheedBoard nasheeds = {nasheeds} onClick={handleClick}/>
      {isOpen && <Modal open={isOpen} onClose={handleClose} text={nasheeds[nasheedId]}/> }
    </div>
  );
}

export default App;
