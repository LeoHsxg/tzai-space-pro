"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type MatterTypes from "matter-js";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
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

type ReportType = "bug" | "suggestion" | "other";

const Info: React.FC = () => {
  const user = useAuth();

  // Form state
  const [reportType, setReportType] = useState<ReportType>("bug");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const spawnedBodiesRef = useRef<MatterTypes.Body[]>([]);

  // Matter.js init
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let destroyed = false;

    const init = async () => {
      const Matter = (await import("matter-js")).default;
      if (destroyed || !canvasRef.current || !containerRef.current) return;

      const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

      const W = containerRef.current.clientWidth;
      const H = containerRef.current.clientHeight;

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

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(async () => {
      if (!containerRef.current || !renderRef.current || !engineRef.current) return;
      const Matter = (await import("matter-js")).default;
      const { Composite, Bodies, Render } = Matter;

      const W = containerRef.current.clientWidth;
      const H = containerRef.current.clientHeight;

      renderRef.current.options.width = W;
      renderRef.current.options.height = H;
      renderRef.current.canvas.width = W * window.devicePixelRatio;
      renderRef.current.canvas.height = H * window.devicePixelRatio;
      renderRef.current.canvas.style.width = `${W}px`;
      renderRef.current.canvas.style.height = `${H}px`;
      Render.lookAt(renderRef.current, { min: { x: 0, y: 0 }, max: { x: W, y: H } });

      // Rebuild walls
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
    if (!user) {
      toast.error("請先登入再送出回報");
      return;
    }
    if (!content.trim()) {
      toast.error("請填寫回報內容");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        type: reportType,
        content: content.trim(),
        ...(contact.trim() && { contact: contact.trim() }),
        userId: user.uid,
        createdAt: Timestamp.now(),
        status: "open",
      });
      toast.success("回報已送出，感謝你！");
      setContent("");
      setContact("");
      setReportType("bug");
    } catch {
      toast.error("送出失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;

    // Ignore drags
    if (mouseDownPosRef.current) {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;
    }

    const Matter = (await import("matter-js")).default;
    const { Bodies, Composite } = Matter;

    // Remove oldest if at cap
    if (bodyCountRef.current >= MAX_BODIES && spawnedBodiesRef.current.length > 0) {
      const oldest = spawnedBodiesRef.current.shift()!;
      Composite.remove(engineRef.current.world, oldest);
      bodyCountRef.current -= 1;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const isBall = Math.random() < 0.5;

    const body = isBall
      ? Bodies.circle(x, y, 14 + Math.random() * 16, {
          restitution: 0.5,
          friction: 0.05,
          frictionAir: 0.008,
          render: { fillStyle: color },
        })
      : Bodies.rectangle(x, y, 30 + Math.random() * 40, 28 + Math.random() * 32, {
          restitution: 0.3,
          friction: 0.2,
          frictionAir: 0.01,
          angle: (Math.random() - 0.5) * 0.3,
          render: { fillStyle: color },
        });

    Composite.add(engineRef.current.world, body);
    spawnedBodiesRef.current.push(body);
    bodyCountRef.current += 1;
  }, []);

  const handleReset = useCallback(async () => {
    if (!engineRef.current) return;
    const Matter = (await import("matter-js")).default;
    spawnedBodiesRef.current.forEach(b => Matter.Composite.remove(engineRef.current!.world, b));
    spawnedBodiesRef.current = [];
    bodyCountRef.current = 0;
  }, []);

  return (
    <div className="w-full pb-4 md:mt-4 flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>

      {/* Form section */}
      <div className="px-[5%] md:max-w-[900px] md:mx-auto w-full">
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
                <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="other">其他</SelectItem>
              </SelectContent>
            </Select>

            <textarea
              className="ipt w-full resize-none pt-4 pb-3 px-[14px] focus:outline-none focus:ring-2 focus:ring-[#5991C4]/30 rounded-xl"
              style={{ height: "112px" }}
              placeholder="請描述你遇到的問題或建議…"
              value={content}
              onChange={e => setContent(e.target.value)}
            />

            <Input
              className="ipt bg-white"
              placeholder="聯絡方式（選填，e.g. 電話、Line ID）"
              value={contact}
              onChange={e => setContact(e.target.value)}
            />

            <Button
              className="myBtn w-full"
              type="submit"
              size="lg"
              disabled={submitting}
            >
              {submitting ? "送出中…" : "送出回報"}
            </Button>
          </form>
        </div>
      </div>

      {/* Physics toy section */}
      <div className="flex-1 flex flex-col mt-4 px-[5%] md:max-w-[900px] md:mx-auto w-full">
        <div className="flex items-center gap-2 mb-2 pl-1">
          <div className="w-2 h-2 rounded-full bg-[#CF6F0D] shrink-0" />
          <span className="noto text-sm font-semibold text-gray-500">點擊生成物體</span>
          <div className="flex-1 h-px bg-gray-200" />
          <button
            onClick={handleReset}
            className="text-xs noto text-black/30 hover:text-black/50 transition-colors"
          >
            清空
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 rounded-2xl overflow-hidden bg-[#F5F5F5]"
          style={{ minHeight: "280px" }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onClick={handleCanvasClick}
            style={{ display: "block", cursor: "crosshair", width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

export default Info;
