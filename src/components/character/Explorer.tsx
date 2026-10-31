"use client";

import { useMemo, useRef } from "react";
import { Group, MeshLambertMaterial, MeshBasicMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { rt } from "@/systems/runtime/runtime";

/**
 * "Pip", an original cartoon explorer built from primitive meshes (no model files):
 * teal jacket, sand safari helmet with goggles, orange backpack, magenta scarf.
 * Animated procedurally from rt.anim: idle, run, jump, fall, land, victory.
 */
export default function Explorer() {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);

  const m = useMemo(
    () => ({
      skin: new MeshLambertMaterial({ color: "#f3b48c" }),
      jacket: new MeshLambertMaterial({ color: "#12b5a6" }),
      pants: new MeshLambertMaterial({ color: "#c9a468" }),
      boot: new MeshLambertMaterial({ color: "#6a3f2b" }),
      pack: new MeshLambertMaterial({ color: "#f97316" }),
      scarf: new MeshLambertMaterial({ color: "#e83e8c" }),
      helmet: new MeshLambertMaterial({ color: "#e8d3a2" }),
      band: new MeshLambertMaterial({ color: "#8a5a2b" }),
      lens: new MeshBasicMaterial({ color: "#7fe3ff" }),
      white: new MeshBasicMaterial({ color: "#ffffff" }),
      dark: new MeshBasicMaterial({ color: "#2a1a14" }),
      hair: new MeshLambertMaterial({ color: "#3b2418" }),
    }),
    [],
  );

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    const t = rt.time;
    const speed = Math.hypot(rt.vel.x, rt.vel.z);
    let bob = 0, lean = 0, spin = 0, squash = 1;
    let aL = 0, aR = 0, lL = 0, lR = 0, aZ = 0, headTilt = 0;

    switch (rt.anim) {
      case "run": {
        const f = 9 + speed * 0.35;
        const s = Math.sin(t * f);
        lL = s * 0.95; lR = -s * 0.95;
        aL = -s * 0.8; aR = s * 0.8;
        bob = Math.abs(Math.cos(t * f)) * 0.07;
        lean = 0.16;
        headTilt = Math.sin(t * f * 0.5) * 0.04;
        break;
      }
      case "jump":
        aL = aR = -2.5; aZ = 0.25; lL = -0.5; lR = 0.35; lean = -0.05; squash = 1.06;
        break;
      case "fall":
        aL = aR = -1.2; aZ = 0.9; lL = 0.25; lR = -0.25; lean = 0.08; squash = 1.03;
        break;
      case "land":
        squash = 0.84; bob = -0.05; lL = lR = -0.5; aL = aR = 0.3; lean = 0.15;
        break;
      case "victory": {
        const s = Math.sin(t * 7);
        aL = aR = -2.9 + s * 0.3; aZ = 0.35;
        bob = Math.abs(Math.sin(t * 5)) * 0.25;
        spin = t * 3;
        break;
      }
      default: {
        const s = Math.sin(t * 2);
        bob = s * 0.012;
        aL = s * 0.05; aR = -s * 0.05;
        squash = 1 + s * 0.012;
        headTilt = Math.sin(t * 0.8) * 0.06;
      }
    }

    // ease towards the target pose so transitions never snap
    const k = Math.min(1, dt * 18);
    const ease = (r: Group | null, axis: "x" | "z", v: number) => {
      if (r) r.rotation[axis] += (v - r.rotation[axis]) * k;
    };
    ease(armL.current, "x", aL);
    ease(armR.current, "x", aR);
    ease(armL.current, "z", aZ);
    ease(armR.current, "z", -aZ);
    ease(legL.current, "x", lL);
    ease(legR.current, "x", lR);
    ease(head.current, "z", headTilt);
    const b = body.current;
    if (b) {
      b.position.y += (bob - b.position.y) * k;
      b.rotation.x += (lean - b.rotation.x) * k;
      b.scale.y += (squash - b.scale.y) * k;
      b.rotation.y = spin;
    }
  });

  return (
    <group ref={root} scale={0.88}>
      <group ref={body}>
        {/* torso */}
        <mesh position={[0, 1.02, 0]} material={m.jacket} castShadow>
          <cylinderGeometry args={[0.3, 0.33, 0.62, 10]} />
        </mesh>
        <mesh position={[0, 0.75, 0]} material={m.band}>
          <cylinderGeometry args={[0.345, 0.345, 0.09, 10]} />
        </mesh>
        <mesh position={[0, 1.36, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.scarf}>
          <torusGeometry args={[0.22, 0.07, 6, 12]} />
        </mesh>
        {/* backpack (model faces +z, pack on the -z side) */}
        <mesh position={[0, 1.05, -0.33]} material={m.pack} castShadow>
          <boxGeometry args={[0.42, 0.5, 0.22]} />
        </mesh>
        <mesh position={[0, 1.2, -0.45]} material={m.band}>
          <boxGeometry args={[0.3, 0.1, 0.06]} />
        </mesh>
        {/* head */}
        <group ref={head} position={[0, 1.66, 0]}>
          <mesh material={m.skin} castShadow>
            <sphereGeometry args={[0.31, 14, 12]} />
          </mesh>
          <mesh position={[0, 0.06, -0.06]} material={m.hair}>
            <sphereGeometry args={[0.31, 12, 10, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.4]} />
          </mesh>
          {/* eyes + smile */}
          {[-0.115, 0.115].map((x) => (
            <group key={x} position={[x, 0.03, 0.27]}>
              <mesh material={m.white}>
                <sphereGeometry args={[0.07, 8, 6]} />
              </mesh>
              <mesh position={[0, 0, 0.045]} material={m.dark}>
                <sphereGeometry args={[0.04, 6, 5]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.1, 0.27]} rotation={[0, 0, Math.PI]} material={m.dark}>
            <torusGeometry args={[0.07, 0.014, 5, 10, Math.PI]} />
          </mesh>
          {/* safari helmet */}
          <mesh position={[0, 0.14, 0]} material={m.helmet} castShadow>
            <sphereGeometry args={[0.36, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
          </mesh>
          <mesh position={[0, 0.15, 0]} material={m.helmet}>
            <cylinderGeometry args={[0.52, 0.52, 0.035, 16]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={m.band}>
            <cylinderGeometry args={[0.365, 0.365, 0.06, 14]} />
          </mesh>
          {/* goggles on the helmet */}
          {[-0.14, 0.14].map((x) => (
            <mesh key={x} position={[x, 0.3, 0.3]} rotation={[Math.PI / 2 - 0.3, 0, 0]} material={m.lens}>
              <cylinderGeometry args={[0.09, 0.09, 0.06, 10]} />
            </mesh>
          ))}
        </group>
        {/* arms */}
        <group ref={armL} position={[-0.42, 1.24, 0]}>
          <mesh position={[0, -0.26, 0]} material={m.jacket} castShadow>
            <cylinderGeometry args={[0.09, 0.08, 0.5, 8]} />
          </mesh>
          <mesh position={[0, -0.56, 0]} material={m.skin}>
            <sphereGeometry args={[0.1, 8, 6]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.42, 1.24, 0]}>
          <mesh position={[0, -0.26, 0]} material={m.jacket} castShadow>
            <cylinderGeometry args={[0.09, 0.08, 0.5, 8]} />
          </mesh>
          <mesh position={[0, -0.56, 0]} material={m.skin}>
            <sphereGeometry args={[0.1, 8, 6]} />
          </mesh>
        </group>
        {/* legs */}
        <group ref={legL} position={[-0.16, 0.72, 0]}>
          <mesh position={[0, -0.28, 0]} material={m.pants} castShadow>
            <cylinderGeometry args={[0.12, 0.11, 0.52, 8]} />
          </mesh>
          <mesh position={[0, -0.6, 0.05]} material={m.boot} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.34]} />
          </mesh>
        </group>
        <group ref={legR} position={[0.16, 0.72, 0]}>
          <mesh position={[0, -0.28, 0]} material={m.pants} castShadow>
            <cylinderGeometry args={[0.12, 0.11, 0.52, 8]} />
          </mesh>
          <mesh position={[0, -0.6, 0.05]} material={m.boot} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.34]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
