'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SimpleVoteButtonProps {
  article: any;
  onVoteUpdate?: (articleId: number | string, voteData: {
    upvotes: number;
    downvotes: number;
    voteScore: number;
    userVote: string | null;
  }) => void;
  compact?: boolean;
}

export function SimpleVoteButton({ article, onVoteUpdate, compact = false }: SimpleVoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState({
    upvotes: article.upvotes || 0,
    downvotes: article.downvotes || 0,
    userVote: article.userVote || null
  });

  // Update local state when article prop changes
  useEffect(() => {
    setLocalVotes({
      upvotes: article.upvotes || 0,
      downvotes: article.downvotes || 0,
      userVote: article.userVote || null
    });
  }, [article.upvotes, article.downvotes, article.userVote]);
  
  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;
    
    const articleId = article.documentId || article.id;
    if (!articleId) {
      console.error('No article ID found for voting');
      return;
    }
    
    // Store original state for rollback
    const originalVotes = { ...localVotes };
    
    // Optimistic update for better UX
    let optimisticVotes = { ...localVotes };
    
    if (localVotes.userVote === voteType) {
      // Toggle off current vote
      optimisticVotes.userVote = null;
      if (voteType === 'upvote') {
        optimisticVotes.upvotes = Math.max(0, optimisticVotes.upvotes - 1);
      } else {
        optimisticVotes.downvotes = Math.max(0, optimisticVotes.downvotes - 1);
      }
    } else if (localVotes.userVote && localVotes.userVote !== voteType) {
      // Switch vote
      if (localVotes.userVote === 'upvote') {
        optimisticVotes.upvotes = Math.max(0, optimisticVotes.upvotes - 1);
      } else {
        optimisticVotes.downvotes = Math.max(0, optimisticVotes.downvotes - 1);
      }
      optimisticVotes.userVote = voteType;
      if (voteType === 'upvote') {
        optimisticVotes.upvotes = optimisticVotes.upvotes + 1;
      } else {
        optimisticVotes.downvotes = optimisticVotes.downvotes + 1;
      }
    } else {
      // First time voting
      optimisticVotes.userVote = voteType;
      if (voteType === 'upvote') {
        optimisticVotes.upvotes = optimisticVotes.upvotes + 1;
      } else {
        optimisticVotes.downvotes = optimisticVotes.downvotes + 1;
      }
    }
    
    // Apply optimistic update
    setLocalVotes(optimisticVotes);
    setIsVoting(true);
    
    try {
      const response = await fetch(` https://api.pattaya1.com/api/breaking-news/${articleId}/${voteType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data) {
          const serverVotes = {
            upvotes: data.data.upvotes || 0,
            downvotes: data.data.downvotes || 0,
            userVote: data.userVote || null
          };
          
          // Update with server response
          setLocalVotes(serverVotes);
          
          // Notify parent component
          onVoteUpdate?.(articleId, {
            upvotes: serverVotes.upvotes,
            downvotes: serverVotes.downvotes,
            voteScore: serverVotes.upvotes - serverVotes.downvotes,
            userVote: serverVotes.userVote
          });
          
          console.log(`✅ ${voteType} successful:`, data.message);
        }
      } else {
        // Rollback optimistic update on error
        setLocalVotes(originalVotes);
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ ${voteType} failed:`, response.status, errorData.message || response.statusText);
      }
    } catch (error) {
      // Rollback optimistic update on error
      setLocalVotes(originalVotes);
      console.error(`❌ ${voteType} error:`, error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`} onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleVote('upvote');
        }}
        disabled={isVoting}
        className={`${compact ? 'h-5 w-auto px-1.5 text-xs' : 'h-6 w-auto px-2 text-xs'} transition-all duration-200 hover:scale-105 ${
          localVotes.userVote === 'upvote' 
            ? 'bg-green-100 text-green-700 border-green-300' 
            : 'hover:bg-green-50 hover:text-green-600'
        } ${isVoting ? 'opacity-60 cursor-not-allowed animate-pulse' : ''}`}
      >
        <span className={compact ? 'text-sm' : 'text-base'}>👍</span>
        <span className={`font-bold ${compact ? 'ml-0.5 min-w-[16px]' : 'ml-1 min-w-[20px]'} text-center`}>{localVotes.upvotes}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleVote('downvote');
        }}
        disabled={isVoting}
        className={`${compact ? 'h-5 w-auto px-1.5 text-xs' : 'h-6 w-auto px-2 text-xs'} transition-all duration-200 hover:scale-105 ${
          localVotes.userVote === 'downvote' 
            ? 'bg-red-100 text-red-700 border-red-300' 
            : 'hover:bg-red-50 hover:text-red-600'
        } ${isVoting ? 'opacity-60 cursor-not-allowed animate-pulse' : ''}`}
      >
        <span className={compact ? 'text-sm' : 'text-base'}>👎</span>
        <span className={`font-bold ${compact ? 'ml-0.5 min-w-[16px]' : 'ml-1 min-w-[20px]'} text-center`}>{localVotes.downvotes}</span>
      </Button>
    </div>
  );
}
