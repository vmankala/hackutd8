import { Avatar, Box, Card, CardContent, Grid, LinearProgress, Typography } from '@mui/material';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';

export const PitVolume = (props) => (
  <Card
    sx={{ height: '100%' }}
  >
    <CardContent>
      <Grid
        container
        spacing={3}
        sx={{ justifyContent: 'space-between' }}
      >
        <Grid item>
          <Typography
            color="textSecondary"
            gutterBottom
            variant="overline"
          >
            PIT VOLUME
          </Typography>
          <Typography
            color="textPrimary"
            variant="h4"
          >
            {props.num}%
          </Typography>
        </Grid>
        <Grid item>
          <Avatar
            sx={{
              backgroundColor: 'warning.main',
              height: 56,
              width: 56
            }}
          >
            <FormatColorFillIcon />
          </Avatar>
        </Grid>
      </Grid>
      <Box sx={{ pt: 3 }}>
        <LinearProgress
          value={props.num}
          variant="determinate"
        />
      </Box>
    </CardContent>
  </Card>
);
