import React from 'react';

import Row from '@components/Row/row';
import Col from '@components/Col/col';
import Button from '@components/Button/button';

import { IServices } from '@ui/models/services.model';

import { UI_STATES } from '@ui/enums/UIStates.enum';

const Home = ({ uiManager }: IServices) => {

  let form: HTMLFormElement;

  const handleSubmit = ev => {
    ev.preventDefault();

    uiManager.switchState(UI_STATES.LOADING);
  };

  return (
    <>
      <Row justify='center'>
        <Col className='col_24' textAlign='center' style={{ margin: '60px 0' }}>Ecosystem</Col>
      </Row>
      <Row justify='center'>
        <Col className='col_6'>
          <form onSubmit={handleSubmit} ref={el => form = el}>
            <input type='text' className='full' placeholder='seed' pattern='^[a-zA-Z]+$' minLength={6} />
            <input type='submit' value='jouer' className='full' />
          </form>
        </Col>
      </Row>
      {/* <Row justify='center'>
        <Col className='col_6' textAlign='center' style={{ margin: 20 }}>
          <Button className='full' onClick={() => uiManager.switchState(UI_STATES.PLAY)}>Jouer</Button>
        </Col>
      </Row> */}
    </>
  );

};

export default Home;
