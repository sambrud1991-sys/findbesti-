import { UserProfile } from "@/data/mockData";
import { Video, Phone, Heart, Ban, MoreVertical, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReportDialog from "@/components/ReportDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserCardProps {
  user: UserProfile;
  isBlocked?: boolean;
  onBlockChange?: () => void;
}

const UserCard = ({ user, isBlocked = false, onBlockChange }: UserCardProps) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    if (!authUser) return;
    setBlocking(true);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({ blocker_id: authUser.id, blocked_id: user.id });
      if (error) throw error;
      toast.success(`${user.name} blocked`);
      onBlockChange?.();
    } catch {
      toast.error("Failed to block user");
    } finally {
      setBlocking(false);
      setShowBlockConfirm(false);
      setShowMenu(false);
    }
  };

  const handleUnblock = async () => {
    if (!authUser) return;
    setBlocking(true);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", authUser.id)
        .eq("blocked_id", user.id);
      if (error) throw error;
      toast.success(`${user.name} unblocked`);
      onBlockChange?.();
    } catch {
      toast.error("Failed to unblock user");
    } finally {
      setBlocking(false);
      setShowMenu(false);
    }
  };

  return (
    <>
      <div className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer aspect-[3/4] active:scale-[0.97] ring-1 ring-border/30">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
        
        {/* Like button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="absolute top-2 right-10 w-8 h-8 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center hover:scale-125 transition-all duration-300"
        >
          <Heart
            size={16}
            className={`transition-all duration-300 ${liked ? "text-primary fill-primary scale-110" : "text-primary-foreground"}`}
          />
        </button>

        {/* More menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center hover:scale-125 transition-all duration-300"
        >
          <MoreVertical size={16} className="text-primary-foreground" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            className="absolute top-12 right-2 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden min-w-[120px] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {isBlocked ? (
              <button
                onClick={handleUnblock}
                disabled={blocking}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-online hover:bg-muted/50 transition-colors"
              >
                <Ban size={14} />
                {blocking ? "..." : "Unblock"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReport(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Flag size={14} />
                  Report
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowBlockConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Ban size={14} />
                  Block
                </button>
              </>
            )}
          </div>
        )}

        {/* Live badge */}
        {user.isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1 gradient-primary px-2 py-0.5 rounded-full shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
            <span className="text-[10px] font-bold text-primary-foreground">LIVE</span>
          </div>
        )}

        {/* Online status */}
        {user.isOnline && !user.isLive && (
          <div className="absolute top-2 left-2">
            <div className="w-3 h-3 rounded-full bg-online border-2 border-card animate-pulse" />
          </div>
        )}

        {/* Blocked overlay */}
        {isBlocked && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <div className="text-center">
              <Ban size={24} className="text-primary-foreground mx-auto mb-1" />
              <span className="text-xs font-bold text-primary-foreground">Blocked</span>
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-end justify-between">
            <div className="transform group-hover:translate-y-0 translate-y-1 transition-transform duration-300">
              <h3 className="text-primary-foreground font-bold text-sm drop-shadow-md">{user.name}, {user.age}</h3>
              <p className="text-primary-foreground/70 text-[10px] drop-shadow">{user.country}</p>
            </div>
            {!isBlocked && (
              <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/video-call/${user.id}`);
                  }}
                  className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
                >
                  <Video size={14} className="text-primary-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/audio-call/${user.id}`);
                  }}
                  className="w-8 h-8 rounded-full bg-online flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
                >
                  <Phone size={14} className="text-primary-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent className="max-w-xs rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Block {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to call you or send messages. You can unblock them anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={blocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleBlock();
              }}
            >
              {blocking ? "Blocking..." : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reportedUserId={user.id}
        reportedUserName={user.name}
      />
    </>
  );
};

export default UserCard;
