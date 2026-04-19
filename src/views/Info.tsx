"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type MatterTypes from "matter-js";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import "../styles/ApplyForm.css";

const COLORS = ["#5991C4", "#CF6F0D", "#E44C4C", "#54A0F9", "#9458E2", "#4CAF50"];
const MAX_BODIES = 80;

type ReportType = "bug" | "suggestion" | "treehouse" | "other";

const PLACEHOLDER_MAP: Record<ReportType, string> = {
  bug: "請描述你遇到的問題…",
  suggestion: "請描述你的功能建議…",
  treehouse: "說說心裡的話吧…",
  other: "請描述你想說的事…",
};

const Info: React.FC = () => {
  const user = useAuth();

  // Form state
  const [reportType, setReportType] = useState<ReportType>("bug");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Layout: compute canvas height after form renders
  const formSectionRef = useRef<HTMLDivElement>(null);
  const [physicsH, setPhysicsH] = useState(300);

  // Matter.js refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MatterTypes.Engine | null>(null);
  const renderRef = useRef<MatterTypes.Render | null>(null);
  const runnerRef = useRef<MatterTypes.Runner | null>(null);
  const groundRef = useRef<MatterTypes.Body | null>(null);
  const wallLRef = useRef<MatterTypes.Body | null>(null);
  const wallRRef = useRef<MatterTypes.Body | null>(null);
  const bodyCountRef = useRef(0);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const spawnedBodiesRef = useRef<MatterTypes.Body[]>([]);

  // Compute physics canvas height based on remaining viewport space
  useEffect(() => {
    const compute = () => {
      if (!formSectionRef.current) return;
      const isMobile = window.innerWidth < 768;
      const footerH = isMobile ? 64 : 0;
      const formBottom = formSectionRef.current.getBoundingClientRect().bottom;
      const sectionHeaderH = 28; // divider row + mb-2
      const bottomPad = 16;
      const h = window.innerHeight - formBottom - sectionHeaderH - footerH - bottomPad;
      setPhysicsH(Math.max(200, h));
    };

    const id = requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", compute);
    };
  }, []);

  // Matter.js init — double RAF ensures physicsH is applied to DOM first
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let destroyed = false;

    const init = async () => {
      const Matter = (await import("matter-js")).default;
      if (destroyed) return;

      // Wait two frames: first for setPhysicsH re-render, second for DOM paint
      await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      if (destroyed || !canvasRef.current || !containerRef.current) return;

      const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

      const W = containerRef.current.clientWidth;
      const H = containerRef.current.clientHeight;
      if (W === 0 || H === 0) return;

      const engine = Engine.create();
      engineRef.current = engine;

      const render = Render.create({
        canvas: canvasRef.current,
        engine,
        options: {
          width: W,
          height: H,
          wireframes: false,
          background: "#F5F5F5",
          pixelRatio: window.devicePixelRatio,
        },
      });
      renderRef.current = render;

      const runner = Runner.create();
      runnerRef.current = runner;

      const ground = Bodies.rectangle(W / 2, H + 25, W + 100, 50, { isStatic: true, render: { fillStyle: "#F5F5F5" } });
      const wallL = Bodies.rectangle(-25, H / 2, 50, H * 2, { isStatic: true, render: { fillStyle: "#F5F5F5" } });
      const wallR = Bodies.rectangle(W + 25, H / 2, 50, H * 2, { isStatic: true, render: { fillStyle: "#F5F5F5" } });
      groundRef.current = ground;
      wallLRef.current = wallL;
      wallRRef.current = wallR;
      Composite.add(engine.world, [ground, wallL, wallR]);

      const mouse = Mouse.create(render.canvas);
      const mConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.2, render: { visible: false } },
      });
      Composite.add(engine.world, mConstraint);
      render.mouse = mouse;

      Render.run(render);
      Runner.run(runner, engine);
    };

    init();

    return () => {
      destroyed = true;
      import("matter-js").then(({ default: Matter }) => {
        if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
        if (renderRef.current) Matter.Render.stop(renderRef.current);
        if (engineRef.current) Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
        renderRef.current = null;
        runnerRef.current = null;
        groundRef.current = null;
        wallLRef.current = null;
        wallRRef.current = null;
        bodyCountRef.current = 0;
        spawnedBodiesRef.current = [];
      });
    };
  }, []);

  // Resize observer: update Matter.js canvas & walls when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(async () => {
      if (!containerRef.current || !renderRef.current || !engineRef.current) return;
      const Matter = (await import("matter-js")).default;
      const { Composite, Bodies, Render } = Matter;

      const W = containerRef.current.clientWidth;
      const H = containerRef.current.clientHeight;
      if (W === 0 || H === 0) return;

      renderRef.current.options.width = W;
      renderRef.current.options.height = H;
      renderRef.current.canvas.width = W * window.devicePixelRatio;
      renderRef.current.canvas.height = H * window.devicePixelRatio;
      renderRef.current.canvas.style.width = `${W}px`;
      renderRef.current.canvas.style.height = `${H}px`;
      Render.lookAt(renderRef.current, { min: { x: 0, y: 0 }, max: { x: W, y: H } });

      if (groundRef.current) Composite.remove(engineRef.current.world, groundRef.current);
      if (wallLRef.current) Composite.remove(engineRef.current.world, wallLRef.current);
      if (wallRRef.current) Composite.remove(engineRef.current.world, wallRRef.current);

      const ground = Bodies.rectangle(W / 2, H + 25, W + 100, 50, { isStatic: true, render: { fillStyle: "#F5F5F5" } });
      const wallL = Bodies.rectangle(-25, H / 2, 50, H * 2, { isStatic: true, render: { fillStyle: "#F5F5F5" } });
      const wallR = Bodies.rectangle(W + 25, H / 2, 50, H * 2, { isStatic: true, render: { fillStyle: "#F5F5F5" } });
      groundRef.current = ground;
      wallLRef.current = wallL;
      wallRRef.current = wallR;
      Composite.add(engineRef.current.world, [ground, wallL, wallR]);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("請先登入再送出回報"); return; }
    if (!content.trim()) { toast.error("請填寫回報內容"); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        type: reportType,
        content: content.trim(),
        userId: user.uid,
        email: user.email,
        createdAt: Timestamp.now(),
        status: "open",
      });
      toast.success(reportType === "treehouse" ? "說出去了！" : "回報已送出，感謝你！");
      setContent("");
      setReportType("bug");
    } catch {
      toast.error("送出失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  const recordStart = useCallback((x: number, y: number) => {
    startPosRef.current = { x, y };
  }, []);

  const spawnAt = useCallback(async (clientX: number, clientY: number) => {
    if (!engineRef.current || !canvasRef.current) return;

    if (startPosRef.current) {
      const dx = clientX - startPosRef.current.x;
      const dy = clientY - startPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) return;
    }

    const Matter = (await import("matter-js")).default;
    const { Bodies, Composite } = Matter;

    if (bodyCountRef.current >= MAX_BODIES && spawnedBodiesRef.current.length > 0) {
      const oldest = spawnedBodiesRef.current.shift()!;
      Composite.remove(engineRef.current.world, oldest);
      bodyCountRef.current -= 1;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const isBall = Math.random() < 0.5;

    const body = isBall
      ? Bodies.circle(x, y, 14 + Math.random() * 16, {
          restitution: 0.5, friction: 0.05, frictionAir: 0.008,
          render: { fillStyle: color },
        })
      : Bodies.rectangle(x, y, 30 + Math.random() * 40, 28 + Math.random() * 32, {
          restitution: 0.3, friction: 0.2, frictionAir: 0.01,
          angle: (Math.random() - 0.5) * 0.3,
          render: { fillStyle: color },
        });

    Composite.add(engineRef.current.world, body);
    spawnedBodiesRef.current.push(body);
    bodyCountRef.current += 1;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    recordStart(e.clientX, e.clientY);
  }, [recordStart]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    spawnAt(e.clientX, e.clientY);
  }, [spawnAt]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches[0]) recordStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [recordStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.changedTouches[0];
    if (touch) spawnAt(touch.clientX, touch.clientY);
  }, [spawnAt]);

  const handleReset = useCallback(async () => {
    if (!engineRef.current) return;
    const Matter = (await import("matter-js")).default;
    spawnedBodiesRef.current.forEach(b => Matter.Composite.remove(engineRef.current!.world, b));
    spawnedBodiesRef.current = [];
    bodyCountRef.current = 0;
  }, []);

  return (
    <div className="w-full md:mt-4 flex flex-col pb-16 md:pb-4">

      {/* Form section */}
      <div ref={formSectionRef} className="px-[5%] md:max-w-[900px] md:mx-auto w-full">
        <div className="flex items-center gap-2 mb-3 pl-1">
          <div className="w-2 h-2 rounded-full bg-[#5991C4] shrink-0" />
          <span className="noto text-sm font-semibold text-gray-600">意見回報</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="ipt w-full">
                <SelectValue placeholder="回報類型" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="bug">Bug 回報</SelectItem>
                <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="suggestion">功能建議</SelectItem>
                <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="treehouse">樹洞</SelectItem>
                <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="other">其他</SelectItem>
              </SelectContent>
            </Select>

            <textarea
              className="ipt w-full resize-none pt-4 pb-3 px-[14px] focus:outline-none focus:ring-2 focus:ring-[#5991C4]/30 rounded-xl"
              style={{ height: "112px" }}
              placeholder={PLACEHOLDER_MAP[reportType]}
              value={content}
              onChange={e => setContent(e.target.value)}
            />

            <Button className="myBtn w-full" type="submit" size="lg" disabled={submitting}>
              {submitting ? "送出中…" : "送出"}
            </Button>
          </form>
        </div>
      </div>

      {/* Physics toy */}
      <div className="flex flex-col mt-4 px-[5%] md:max-w-[900px] md:mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-px bg-gray-200" />
          <button
            onClick={handleReset}
            className="text-xs noto text-black/25 hover:text-black/45 transition-colors"
          >
            清空
          </button>
        </div>

        <div
          ref={containerRef}
          className="rounded-2xl overflow-hidden bg-[#F5F5F5]"
          style={{ height: `${physicsH}px` }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ display: "block", cursor: "crosshair", touchAction: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default Info;
