import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import MyModal from "../components/Modal";
import SeoHelmet from "../components/SeoHelmet";
import { useAuth } from "../components/AuthContext";
import { SnackbarAlert } from "../utils/helperFunctions";
import { baseURL } from "../utils/constants";
import { buildSlideshowModalData } from "../utils/slideshowHelpers";
import { getSocket } from "../utils/socket";

const LiveSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [leaderSlideIndex, setLeaderSlideIndex] = useState(0);
  const [viewerSlideIndex, setViewerSlideIndex] = useState(0);
  const [viewerFollowingLeader, setViewerFollowingLeader] = useState(true);
  const [shareUrl, setShareUrl] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({ type: "error", message: "" });
  const isLeaderRef = useRef(false);
  const viewerFollowingLeaderRef = useRef(true);

  const isLeader = Boolean(user?.id && session?.leaderUserId === user.id);

  useEffect(() => {
    isLeaderRef.current = isLeader;
  }, [isLeader]);

  useEffect(() => {
    viewerFollowingLeaderRef.current = viewerFollowingLeader;
  }, [viewerFollowingLeader]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const sessionResponse = await fetch(
          `${baseURL}/live-session/session/${sessionId}`
        );
        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Failed to load live session.");
        }

        const foundSession = sessionData.foundLiveSession;

        if (!foundSession.isActive) {
          throw new Error("This live session is no longer active.");
        }

        const slideshowResponse = await fetch(
          `${baseURL}/slideshow/${foundSession.slideshowId}`
        );
        const slideshowData = await slideshowResponse.json();

        if (!slideshowResponse.ok) {
          throw new Error(
            slideshowData.error || slideshowData.message || "Failed to load slideshow."
          );
        }

        const uniqueNasheedIds = [
          ...new Set(
            (slideshowData.foundSlideshow.slides || []).map((slide) => slide.nasheedId)
          ),
        ];

        const nasheedResponses = await Promise.all(
          uniqueNasheedIds.map((nasheedId) => fetch(`${baseURL}/nasheed/${nasheedId}`))
        );
        const nasheedPayloads = await Promise.all(
          nasheedResponses.map((response) => response.json())
        );

        const nasheedMap = {};
        nasheedPayloads.forEach((payload) => {
          if (payload.foundNasheed?._id) {
            nasheedMap[payload.foundNasheed._id] = payload.foundNasheed;
          }
        });

        setSession(foundSession);
        setLeaderSlideIndex(foundSession.currentSlideIndex || 0);
        setViewerSlideIndex(foundSession.currentSlideIndex || 0);
        setViewerFollowingLeader(true);
        setModalData(buildSlideshowModalData(slideshowData.foundSlideshow, nasheedMap));
      } catch (error) {
        setAlert({
          type: "error",
          message: error.message || "Failed to load live session.",
        });
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    const socket = getSocket();
    socket.connect();

    const handleJoined = (joinedSession) => {
      setSession((prev) => ({ ...prev, ...joinedSession }));
      setLeaderSlideIndex(joinedSession.currentSlideIndex || 0);
      setViewerSlideIndex(joinedSession.currentSlideIndex || 0);
      setViewerFollowingLeader(true);
    };

    const handleUpdated = (updatedSession) => {
      setSession(updatedSession);
      setLeaderSlideIndex(updatedSession.currentSlideIndex || 0);
      setViewerSlideIndex((prev) =>
        isLeaderRef.current || viewerFollowingLeaderRef.current
          ? updatedSession.currentSlideIndex || 0
          : prev
      );
    };

    const handleEnded = () => {
      setAlert({
        type: "info",
        message: "This live session has ended.",
      });
      setShowAlert(true);
      setTimeout(() => navigate("/"), 1200);
    };

    const handleError = (payload) => {
      setAlert({
        type: "error",
        message: payload?.message || "There was a live session error.",
      });
      setShowAlert(true);
    };

    socket.on("session-joined", handleJoined);
    socket.on("session-updated", handleUpdated);
    socket.on("session-ended", handleEnded);
    socket.on("session-error", handleError);
    socket.emit("join-session", { sessionId });

    return () => {
      socket.emit("leave-session", { sessionId });
      socket.off("session-joined", handleJoined);
      socket.off("session-updated", handleUpdated);
      socket.off("session-ended", handleEnded);
      socket.off("session-error", handleError);
      socket.disconnect();
    };
  }, [navigate, sessionId]);

  const sessionMeta = useMemo(
    () =>
      session
        ? {
            sessionCode: session.sessionId,
            shareUrl,
            isLeader,
            isOutOfSync: !isLeader && !viewerFollowingLeader,
          }
        : null,
    [isLeader, session, shareUrl, viewerFollowingLeader]
  );

  const handlePresentationIndexChange = (nextIndex) => {
    if (isLeader) {
      setLeaderSlideIndex(nextIndex);
    } else {
      setViewerSlideIndex(nextIndex);
      setViewerFollowingLeader(false);
      return;
    }

    const socket = getSocket();
    socket.emit("update-current-slide", {
      sessionId,
      currentSlideIndex: nextIndex,
      leaderUserId: user?.id,
    });
  };

  const handleSyncToLeader = () => {
    setViewerSlideIndex(leaderSlideIndex);
    setViewerFollowingLeader(true);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setAlert({
        type: "success",
        message: "Session link copied.",
      });
      setShowAlert(true);
    } catch (error) {
      setAlert({
        type: "error",
        message: "Unable to copy the session link.",
      });
      setShowAlert(true);
    }
  };

  const handleEndSession = async () => {
    if (!session?._id || !token) {
      return;
    }

    try {
      const response = await fetch(`${baseURL}/live-session/${session._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to end session.");
      }

      navigate("/");
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to end session.",
      });
      setShowAlert(true);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!modalData || !session) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <SnackbarAlert
          open={showAlert}
          onClose={() => setShowAlert(false)}
          message={alert.message}
          type={alert.type}
        />
        <Alert severity="error">Unable to load this live session.</Alert>
      </Container>
    );
  }

  return (
    <>
      <SeoHelmet
        title={`Live session ${session.sessionId}`}
        description="Join a synchronized live slideshow session."
        url={`https://dhikrpedia.com/session/${sessionId}`}
        type="website"
      />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <SnackbarAlert
          open={showAlert}
          onClose={() => setShowAlert(false)}
          message={alert.message}
          type={alert.type}
        />
        <Stack spacing={2}>
          <Box sx={{ textAlign: "left" }}>
            <Typography variant="h5">Live session {session.sessionId}</Typography>
            <Typography color="text.secondary">
              {isLeader
                ? "You are leading this session."
                : "You are viewing the leader's live presentation."}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField label="Session link" value={shareUrl} InputProps={{ readOnly: true }} />
            <Button variant="outlined" onClick={handleCopyLink}>
              Copy link
            </Button>
            <Button variant="text" onClick={() => navigate("/")}>
              Back home
            </Button>
          </Box>
        </Stack>
      </Container>
      <MyModal
        open
        onClose={() => navigate("/")}
        nasheed={modalData}
        presentationIndex={isLeader ? leaderSlideIndex : viewerSlideIndex}
        onPresentationIndexChange={handlePresentationIndexChange}
        forcePresentationMode
        disablePresentationControls={false}
        sessionMeta={{
          ...sessionMeta,
          onCopyLink: handleCopyLink,
          onEndSession: handleEndSession,
          onLeaveSession: () => navigate("/"),
          onSyncToLeader: handleSyncToLeader,
        }}
      />
    </>
  );
};

export default LiveSession;
