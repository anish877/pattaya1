'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface IsolatedVoteButtonProps {
  article: any;
  onVoteUpdate?: (articleId: number | string, voteData: {
    upvotes: number;
    downvotes: number;
    voteScore: number;
  }) => void;
}

export function IsolatedVoteButton({ article, onVoteUpdate }: IsolatedVoteButtonProps) {
  // Create stable unique key for this article instance
  const articleKey = useMemo(() => `${article.documentId || article.id}`, [article.documentId, article.id]);
  
  const [isVoting, setIsVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState({
    upvotes: article.upvotes || 0,
    downvotes: article.downvotes || 0
  });
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  
  // Update local votes when article prop changes
  useEffect(() => {
    setLocalVotes({
      upvotes: article.upvotes || 0,
      downvotes: article.downvotes || 0
    });
  }, [article.upvotes, article.downvotes]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;
    
    console.log(`[${articleKey}] Voting ${voteType}, current userVote:`, userVote);
    
    // Calculate new vote counts based on current user vote state
    let newVotes = { ...localVotes };
    let newUserVote: 'upvote' | 'downvote' | null = null;
    
    if (userVote === voteType) {
      // Toggle off - remove current vote
      if (voteType === 'upvote') {
        newVotes.upvotes = Math.max(0, newVotes.upvotes - 1);
      } else {
        newVotes.downvotes = Math.max(0, newVotes.downvotes - 1);
      }
      newUserVote = null;
      console.log(`[${articleKey}] Toggling off ${voteType}`);
    } else if (userVote && userVote !== voteType) {
      // Switch vote - remove old, add new
      if (userVote === 'upvote') {
        newVotes.upvotes = Math.max(0, newVotes.upvotes - 1);
        newVotes.downvotes = newVotes.downvotes + 1;
      } else {
        newVotes.downvotes = Math.max(0, newVotes.downvotes - 1);
        newVotes.upvotes = newVotes.upvotes + 1;
      }
      newUserVote = voteType;
      console.log(`[${articleKey}] Switching from ${userVote} to ${voteType}`);
    } else {
      // First time voting
      if (voteType === 'upvote') {
        newVotes.upvotes = newVotes.upvotes + 1;
      } else {
        newVotes.downvotes = newVotes.downvotes + 1;
      }
      newUserVote = voteType;
      console.log(`[${articleKey}] First vote ${voteType}`);
    }
    
    // Update UI immediately for instant feedback
    setLocalVotes(newVotes);
    setUserVote(newUserVote);
    
    // Make API call to backend for persistence
    const articleId = article.documentId || article.id;
    if (articleId) {
      setIsVoting(true);
      try {
        const endpoint = newUserVote || 'remove-vote';
        const response = await fetch(` http://localhost:1337/api/breaking-news/${articleId}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[${articleKey}] Backend updated:`, data);
          
          // Update with actual backend response if available
          if (data.data) {
            const backendVotes = {
              upvotes: data.data.upvotes || newVotes.upvotes,
              downvotes: data.data.downvotes || newVotes.downvotes
            };
            setLocalVotes(backendVotes);
            
            // Notify parent component to update its state
            onVoteUpdate?.(articleKey, {
              upvotes: backendVotes.upvotes,
              downvotes: backendVotes.downvotes,
              voteScore: backendVotes.upvotes - backendVotes.downvotes
            });
          }
        } else {
          console.error(`[${articleKey}] Vote failed:`, response.statusText);
          // Revert changes on failure
          setLocalVotes({
            upvotes: article.upvotes || 0,
            downvotes: article.downvotes || 0
          });
          setUserVote(null);
        }
      } catch (error) {
        console.error(`[${articleKey}] Vote error:`, error);
        // Revert changes on failure
        setLocalVotes({
          upvotes: article.upvotes || 0,
          downvotes: article.downvotes || 0
        });
        setUserVote(null);
      } finally {
        setIsVoting(false);
      }
    }
  };


  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleVote('upvote');
        }}
        disabled={isVoting}
        className={`h-6 w-auto px-2 text-xs transition-all duration-200 hover:scale-105 ${
          userVote === 'upvote' 
            ? 'bg-green-100 text-green-700 border-green-300' 
            : 'hover:bg-green-50 hover:text-green-600'
        } ${isVoting ? 'opacity-60 cursor-not-allowed animate-pulse' : ''}`}
      >
        <span className="text-base">👍</span>
        <span className="font-bold ml-1 min-w-[20px] text-center">{localVotes.upvotes}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleVote('downvote');
        }}
        disabled={isVoting}
        className={`h-6 w-auto px-2 text-xs transition-all duration-200 hover:scale-105 ${
          userVote === 'downvote' 
            ? 'bg-red-100 text-red-700 border-red-300' 
            : 'hover:bg-red-50 hover:text-red-600'
        } ${isVoting ? 'opacity-60 cursor-not-allowed animate-pulse' : ''}`}
      >
        <span className="text-base">👎</span>
        <span className="font-bold ml-1 min-w-[20px] text-center">{localVotes.downvotes}</span>
      </Button>
    </div>
  );
}
