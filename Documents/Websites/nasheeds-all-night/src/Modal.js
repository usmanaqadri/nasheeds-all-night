import React, {useState, useEffect} from 'react'
import './Modal.css'

const Modal = ({open, onClose, text}) => {
	let {arab, arabTitle, engTitle, eng, rom} = text;
	
	const [counter, setCounter] = useState(0);

	const handleUserKeyPress = (e) => {
    if (e.code === "ArrowRight" ) {
      if (counter===eng.length){
      	onClose();
      	setCounter(0);
      }
      else {
      	setCounter(counter + 2)
      }
    }
    if (e.code === "ArrowLeft") {
      if (counter === 0) setCounter(0)
      else setCounter(counter -2)
    }
    if (e.code === "Escape") {
      setCounter(0);
      onClose();
    }
  }
  useEffect(() => {
    window.addEventListener('keydown', handleUserKeyPress);

    return () => {
      window.removeEventListener('keydown', handleUserKeyPress);
    };
  })

	if (!open) return null
	return (
		<>
			<div onClick = {onClose} className="overlay" />
			<div className="modal">
				<div className="title">
					<h1>{arabTitle}<br/>{engTitle}</h1>
				</div>
				<div className="body">
					<div className="paragraph">
						<p>{arab[counter]}</p>
						<p><em>{rom[counter]}</em></p>
						<p>{eng[counter]}</p>	
					</div>
					<div className="paragraph">
						<p>{arab[counter+1]}</p>
						<p><em>{rom[counter+1]}</em></p>
						<p>{eng[counter+1]}</p>	
					</div>		
				</div>
				
			</div>
		</>
		
	)
}

export default Modal