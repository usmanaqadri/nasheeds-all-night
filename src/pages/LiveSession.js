import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
    const fetchSessionData = async () => {
      setLoading(true);

      try {
        // 1. Fetch live session using the URL code
        const sessionResponse = await fetch(
          `${baseURL}/live-session/session/${encodeURIComponent(sessionId)}`,
        );

        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || "Failed to load live session.");
        }

        const foundSession = sessionData.foundLiveSession;

        if (!foundSession) {
          throw new Error("Live session not found.");
        }

        if (!foundSession.isActive) {
          throw new Error("This live session is no longer active.");
        }

        // 2. Fetch the associated slideshow
        const slideshowResponse = await fetch(
          `${baseURL}/slideshow/${foundSession.slideshowId}`,
        );

        const slideshowData = await slideshowResponse.json();

        if (!slideshowResponse.ok) {
          throw new Error(
            slideshowData.error ||
              slideshowData.message ||
              "Failed to load slideshow.",
          );
        }

        const slideshow = slideshowData.foundSlideshow;

        // 3. Collect unique nasheed IDs
        const uniqueNasheedIds = [
          ...new Set(
            (slideshow.slides || [])
              .map((slide) => slide.nasheedId)
              .filter(Boolean)
              .map(String),
          ),
        ];

        // 4. Fetch NasheedV2 documents
        const nasheedEntries = await Promise.all(
          uniqueNasheedIds.map(async (nasheedId) => {
            const response = await fetch(
              `${baseURL}/nasheedV2/id/${nasheedId}`,
            );

            if (!response.ok) {
              throw new Error(
                `Failed to load NasheedV2 ${nasheedId}: ${response.status}`,
              );
            }

            const payload = await response.json();

            const nasheed =
              payload.foundNasheedV2 ??
              payload.foundNasheed ??
              payload.nasheed ??
              payload;

            if (!nasheed?._id) {
              throw new Error(`Invalid NasheedV2 response for ${nasheedId}`);
            }

            return [String(nasheed._id), nasheed];
          }),
        );

        const nasheedMap = Object.fromEntries(nasheedEntries);

        // 5. Build the slideshow presentation
        const builtModalData = buildSlideshowModalData(slideshow, nasheedMap);

        // 6. Initialize live session state
        setSession(foundSession);
        setLeaderSlideIndex(foundSession.currentSlideIndex || 0);
        setViewerSlideIndex(foundSession.currentSlideIndex || 0);
        setViewerFollowingLeader(true);
        setModalData(builtModalData);

        console.log("Live session loaded:", foundSession.sessionId);
        console.log("Nasheeds loaded:", uniqueNasheedIds.length);
        console.log("Built slideshow:", builtModalData);
      } catch (error) {
        console.error("Failed to load live session:", error);

        setAlert({
          type: "error",
          message: error.message || "Failed to load live session.",
        });
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    isLeaderRef.current = isLeader;
  }, [isLeader]);

  useEffect(() => {
    viewerFollowingLeaderRef.current = viewerFollowingLeader;
  }, [viewerFollowingLeader]);

  useEffect(() => {
    if (session?.sessionId) {
      setShareUrl(`${window.location.origin}/session/${session.sessionId}`);
    }
  }, [session?.sessionId]);

  useEffect(() => {
    if (!session?.sessionId) {
      return undefined;
    }

    const canonicalSessionId = session.sessionId;
    const socket = getSocket();

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
          : prev,
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

    const joinSession = () => {
      socket.emit("join-session", { sessionId: canonicalSessionId });
    };

    socket.on("connect", joinSession);
    socket.connect();

    if (socket.connected) {
      joinSession();
    }

    return () => {
      socket.emit("leave-session", { sessionId: canonicalSessionId });
      socket.off("connect", joinSession);
      socket.off("session-joined", handleJoined);
      socket.off("session-updated", handleUpdated);
      socket.off("session-ended", handleEnded);
      socket.off("session-error", handleError);
      socket.disconnect();
    };
  }, [navigate, session?.sessionId]);

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
    [isLeader, session, shareUrl, viewerFollowingLeader],
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
      sessionId: session.sessionId,
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
            <Typography variant="h5">
              Live session {session.sessionId}
            </Typography>
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
            <TextField
              label="Session link"
              value={shareUrl}
              InputProps={{ readOnly: true }}
            />
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
