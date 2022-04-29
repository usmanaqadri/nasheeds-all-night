import React, { useState, useEffect } from 'react'
import './Modal.css'

const Modal = ({ open, onClose, text }) => {
	let { arab, arabTitle, engTitle, eng, rom } = text;

	const [counter, setCounter] = useState(0);

	const handleClick = (e) => {
		const clickTarget = e.target;
		const clickTargetWidth = clickTarget.offsetWidth;
		const xCoordInClickTarget = e.clientX - clickTarget.getBoundingClientRect().left;
			if (clickTargetWidth / 2 > xCoordInClickTarget) {
				e.preventDefault();
				if (counter === 0) setCounter(0)
				else setCounter(counter - 2)
			} else {
				if (counter === eng.length) {
					onClose();
					setCounter(0);
				}
				else {
					setCounter(counter + 2)
				}
			}
	}
	
	const handleUserKeyPress = (e) => {
	
		
		if (e.code === "ArrowLeft") {
			e.preventDefault();
			if (counter === 0) setCounter(0)
			else setCounter(counter - 2)
		}
		if (e.code === "ArrowRight") {
			if (counter === eng.length) {
				onClose();
				setCounter(0);
			}
			else {
				setCounter(counter + 2)
			}
		}
		if (e.code === "Escape") {
			onClose();
			setCounter(0);
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
			<div onClick={onClose} className="overlay" />
			<div onClick={handleClick} className="modal">
				<div className="title">
					<h1 className="arabText">{arabTitle}<br />{engTitle}</h1>
				</div>
				<div className="body">
					<div className="paragraph">
						<p className="arabText">{arab[counter]}</p>
						<p className="engText">
							<em dangerouslySetInnerHTML={{ __html: rom[counter] }} />
						</p>
						<p className="engText">{eng[counter]}</p>
					</div>
					<div className="paragraph">
						<p className="arabText">{arab[counter + 1]}</p>
						<p className='engText'>
							<em dangerouslySetInnerHTML={{ __html: rom[counter + 1] }} />
						</p>
						<p className="engText">{eng[counter + 1]}</p>
					</div>
				</div>

			</div>
		</>

	)
}

export default Modal