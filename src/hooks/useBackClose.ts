"use client";

import { useEffect, useRef } from "react";

/**
 * 모바일 뒤로가기(Android back, iOS swipe-back)로 Sheet/Modal을 닫는 훅.
 *
 * 열릴 때 history.pushState → 뒤로가기 시 popstate → onClose 호출.
 * 프로그래밍으로 닫힐 때는 pushState를 되돌려 history 오염 방지.
 */
export function useBackClose(open: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const closedByPop = useRef(false);

  useEffect(() => {
    if (!open) {
      // 프로그래밍으로 닫힌 경우 — pushState한 엔트리 제거
      if (pushed.current && !closedByPop.current) {
        history.back();
      }
      pushed.current = false;
      closedByPop.current = false;
      return;
    }

    // 열릴 때 history에 가상 엔트리 추가
    history.pushState({ __backClose: true }, "");
    pushed.current = true;
    closedByPop.current = false;

    const onPopState = () => {
      closedByPop.current = true;
      pushed.current = false;
      onClose();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, onClose]);
}
