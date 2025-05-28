import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TEMPLATEPAGE = () => {

    const [visible, setVisible] = useState(false);
    const [buttonVisible,setButtonVisible] = useState(false);
    const navigate = useNavigate();


    //this is for fade in effect for the title text
    useEffect(() => {
        //delay 300ms
        const timer = setTimeout(() => setVisible(true), 300); 
        return () => clearTimeout(timer);
    }, []);

    //this is for fade in effect for the button to view the actual model
    useEffect(() => {
        //delay until after the title delay + fade in so 1.8 seconds  
        const buttonTimer = setTimeout(() => setButtonVisible(true), 1800); 
        return () => clearTimeout(buttonTimer);
    }, []);


    //Our custom style for the text
    const textStyle = {
        fontFamily: "'Roboto', sans-serif",
    };

    return (
        <div>

            <Box display="flex" flexDirection="column"
                justifyContent="center"
                alignItems="center"
                style={{ minHeight: '80vh', paddingTop: '15vh' }}>

                <Container maxWidth="md" style={textStyle}>
                    <Typography variant="h3" component="h1" gutterBottom
                        style={{
                            ...textStyle, fontWeight: 'bold', textAlign: 'center', opacity: visible ? 1 : 0,
                            transition: 'opacity 1.5s ease-out',
                        }}>
                        Welcome to Rotoskape
                    </Typography>

                    {/* Button for the real estate simulation */}
                    <Box display="flex" flexDirection="column" justifyContent="center" mt={4}>
                        <Button variant="contained" 
                        color="info" 
                        sx={{ width: 'fit-content', mx: 'auto', opacity: buttonVisible ? 1 : 0,
                        transition: 'opacity 1s ease-out' }}
                        onClick={() => navigate('/designer')}>
                            Start Room Designer
                        </Button>
                    </Box>

                </Container>

            </Box>






        </div>
    );
};

export default TEMPLATEPAGE;
