// Contact.js
import React from "react";
import { Container, Typography } from "@mui/material";

const Contact = () => {
  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Contact Us
      </Typography>
      <Typography paragraph>
        Email: info@example.com
      </Typography>
      <Typography paragraph>
        Phone: (123) 456-7890
      </Typography>
      <Typography paragraph>
        Address: 1234 Main St, City, Country
      </Typography>
    </Container>
  );
};

export default Contact;
