import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import SeoHelmet from "../components/SeoHelmet";
import { useAuth } from "../components/AuthContext";
import { SnackbarAlert } from "../utils/helperFunctions";
import { baseURL } from "../utils/constants";

const CreateSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState(null);
  const [slideshows, setSlideshows] = useState([]);
  const [alert, setAlert] = useState({ type: "error", message: "" });
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchSlideshows = async () => {
      try {
        const response = await fetch(`${baseURL}/slideshow?userId=${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load slideshows.");
        }

        setSlideshows(data.slideshows || []);
      } catch (error) {
        setAlert({
          type: "error",
          message: error.message || "Failed to load slideshows.",
        });
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSlideshows();
  }, [user?.id]);

  const handleCreateSession = async (slideshowId) => {
    if (!token || !user?.id) {
      setAlert({
        type: "error",
        message: "You must be logged in to start a live session.",
      });
      setShowAlert(true);
      return;
    }

    setCreatingId(slideshowId);

    try {
      const response = await fetch(`${baseURL}/live-session/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slideshowId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create live session.");
      }

      navigate(`/session/${data.sessionId}`);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to create live session.",
      });
      setShowAlert(true);
    } finally {
      setCreatingId(null);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <SeoHelmet
        title="Start a live session"
        description="Choose one of your slideshows and start a synchronized live session."
        url="https://dhikrpedia.com/create/session"
        type="website"
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SnackbarAlert
          open={showAlert}
          onClose={() => setShowAlert(false)}
          message={alert.message}
          type={alert.type}
        />
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ textAlign: "left", mb: 1 }}>
              New live session
            </Typography>
            <Typography
              sx={{ textAlign: "left", color: "text.secondary", fontSize: "1.1rem" }}
            >
              Pick one of your slideshows and we&apos;ll create a session that
              keeps everyone synchronized to your presentation.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            When people join your session later, they&apos;ll land on the exact
            slide you are currently presenting.
          </Alert>

          {!user?.id ? (
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography sx={{ textAlign: "left" }}>
                Sign in first to start a live session.
              </Typography>
            </Paper>
          ) : slideshows.length === 0 ? (
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography sx={{ textAlign: "left" }}>
                You do not have any slideshows yet. Create a slideshow first,
                then come back here to present it live.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {slideshows.map((slideshow) => (
                <Card key={slideshow._id} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack spacing={2} sx={{ textAlign: "left" }}>
                      <Box>
                        <Typography variant="h6">{slideshow.title}</Typography>
                        <Typography color="text.secondary">
                          {slideshow.slides.length} session item
                          {slideshow.slides.length === 1 ? "" : "s"}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => handleCreateSession(slideshow._id)}
                        disabled={creatingId === slideshow._id}
                      >
                        Start session
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default CreateSession;
