import React from "react";
import { Container, Typography } from "@mui/material";

function About({data}) {
  return (
    <Container sx={{ py: 4 }} id="about">
      <Typography variant="h4" gutterBottom align="center">
        About Us
      </Typography>

      <Typography variant="body1" paragraph dangerouslySetInnerHTML={{__html : data.description}}>
      </Typography>
    </Container>
  );
}

export default About;
