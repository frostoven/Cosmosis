import React from 'react';

const INPUT_STYLE = {
  color: '#ffffff',
  backgroundColor: '#565b5d',
  borderTop: 'thin solid black',
  borderBottom: 'thin solid black',
  marginTop: -1,
};

export default function TextInput(props) {
  return (
    <div className='ui input'>
      <input defaultValue={props.defaultValue} style={INPUT_STYLE}/>
    </div>
  );
}
