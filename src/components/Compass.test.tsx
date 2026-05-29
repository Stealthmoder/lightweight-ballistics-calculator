import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Compass } from './Compass';
import * as fc from 'fast-check';

/**
 * Bug Condition Exploration Test for Wind Direction Arrowhead Tip at Center
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
 * 
 * This test encodes the EXPECTED behavior (arrowhead tip at center).
 * On UNFIXED code, this test MUST FAIL - proving the bug exists.
 * After the fix is implemented, this test will PASS - confirming the fix works.
 */
describe('Compass - Bug Condition Exploration', () => {
  /**
   * Property 1: Fault Condition - Arrowhead Tip at Center When arrowInward=true
   * 
   * For any Compass component rendered with arrowInward={true}, the arrowhead polygon
   * SHALL be positioned with its TIP exactly at the compass center point (y=120),
   * creating a traditional arrow appearance where the tip points to the exact center.
   * 
   * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists.
   * **Expected counterexamples on unfixed code**:
   * - Polygon points show tip at y=131 instead of y=120 (11 pixels below center)
   * - Base at y=109 (symmetric around center instead of tip at center)
   * - Gap between shaft endpoint (y=109) and arrowhead base (y=109)
   */
  it('Property 1: arrowhead tip should be at center when arrowInward=true', () => {
    fc.assert(
      fc.property(
        // Test specific directions: North (0°), East (90°), South (180°)
        fc.constantFrom(0, 90, 180),
        (direction) => {
          // Render compass with arrowInward=true
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              arrowInward={true}
            />
          );

          // Find the arrowhead polygon element
          const polygon = container.querySelector('g polygon');
          expect(polygon).toBeTruthy();

          // Extract polygon points
          const pointsAttr = polygon?.getAttribute('points');
          expect(pointsAttr).toBeTruthy();

          // Parse the polygon points
          // Current (buggy) format: "${center - 10},${center - 11} ${center + 10},${center - 11} ${center},${center + 11}"
          //   Evaluates to: "110,109 130,109 120,131" (tip at y=131, base at y=109)
          // Expected format after fix: "${center - 10},${center - 22} ${center + 10},${center - 22} ${center},${center}"
          //   Should evaluate to: "110,98 130,98 120,120" (tip at y=120, base at y=98)
          const points = pointsAttr!.trim().split(/\s+/).map(point => {
            const [x, y] = point.split(',').map(Number);
            return { x, y };
          });

          expect(points.length).toBe(3); // Triangle has 3 points

          // The compass center is at y=120 (size/2 where size=240)
          const compassCenter = 120;

          // Extract the y-coordinates of the three points
          // Points are: [left-base, right-base, tip]
          const baseY1 = points[0].y;
          const baseY2 = points[1].y;
          const tipY = points[2].y;

          // Log counterexample details when test fails
          if (Math.abs(tipY - compassCenter) > 1) {
            console.log('COUNTEREXAMPLE FOUND:');
            console.log(`  Direction: ${direction}°`);
            console.log(`  Polygon points: ${pointsAttr}`);
            console.log(`  Base Y: ${baseY1}, Tip Y: ${tipY}`);
            console.log(`  Compass center Y: ${compassCenter}`);
            console.log(`  Tip offset from center: ${tipY - compassCenter} pixels`);
            console.log(`  Expected: Tip at y=${compassCenter}, Base at y=${compassCenter - 22}`);
            console.log(`  Actual: Tip at y=${tipY}, Base at y=${baseY1}`);
          }

          // Verify base points have the same y-coordinate (horizontal base)
          expect(baseY1).toBe(baseY2);

          // EXPECTED BEHAVIOR (what the test asserts):
          // 1. The tip should be EXACTLY at the compass center (y = 120)
          expect(Math.abs(tipY - compassCenter)).toBeLessThanOrEqual(1);

          // 2. The base should be ABOVE the tip (y < tip)
          expect(baseY1).toBeLessThan(tipY);

          // 3. The base should be approximately 22 pixels above center
          // (arrowhead height is 22 pixels, with tip at center)
          expect(Math.abs(baseY1 - (compassCenter - 22))).toBeLessThanOrEqual(1);

          // 4. Verify shaft overlaps with arrowhead base
          const line = container.querySelector('g line');
          expect(line).toBeTruthy();
          const lineY2 = parseFloat(line?.getAttribute('y2') || '0');
          
          // Shaft endpoint should be at or slightly above the arrowhead base
          // to create visual overlap (traditional arrow appearance)
          expect(lineY2).toBeLessThanOrEqual(baseY1 + 2);
        }
      ),
      {
        numRuns: 10, // Test with 3 specific directions, run multiple times
        verbose: true, // Show counterexamples when test fails
      }
    );
  });
});

/**
 * Preservation Property Tests for Wind Direction Arrowhead Centering
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * These tests capture the CURRENT behavior of the compass for non-buggy inputs
 * (arrowInward=false or undefined). They run on UNFIXED code and MUST PASS,
 * establishing the baseline behavior that must be preserved after the fix.
 * 
 * After implementing the fix, these tests will continue to pass, confirming
 * no regressions were introduced.
 */
describe('Compass - Preservation Properties', () => {
  /**
   * Property 2: Preservation - Non-Inward Arrow Behavior
   * 
   * For any Compass component rendered with arrowInward={false} or arrowInward undefined,
   * the compass SHALL display the outward-pointing arrow with its current positioning,
   * correct rotation, interactivity, and all visual elements unchanged.
   * 
   * **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline to preserve)
   */

  it('Property 2.1: outward-pointing arrow displays with current positioning when arrowInward=false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),
        (direction) => {
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              arrowInward={false}
            />
          );

          // Find the arrow polygon (outward-pointing)
          const polygon = container.querySelector('g polygon');
          expect(polygon).toBeTruthy();

          // Extract polygon points
          const pointsAttr = polygon?.getAttribute('points');
          expect(pointsAttr).toBeTruthy();

          // Parse points
          const points = pointsAttr!.trim().split(/\s+/).map(point => {
            const [x, y] = point.split(',').map(Number);
            return { x, y };
          });

          expect(points.length).toBe(3);

          // Observe current behavior: outward arrow has tip at the rim
          // The compass has center=120, radius=100 (center-20)
          // arrowRimInset=6, so the tip should be at approximately y=20+6=26
          const compassCenter = 120;
          const radius = 100;
          const arrowRimInset = 6;
          const expectedTipY = compassCenter - radius + arrowRimInset;

          // The tip is the third point (index 2)
          const tipY = points[2].y;

          // Verify tip is at the rim (within tolerance)
          expect(Math.abs(tipY - expectedTipY)).toBeLessThanOrEqual(2);

          // Verify the arrow points outward (tip y-coordinate is less than base)
          const baseY = points[0].y;
          expect(tipY).toBeLessThan(baseY);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2.2: outward-pointing arrow displays correctly when arrowInward is undefined', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),
        (direction) => {
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              // arrowInward is undefined
            />
          );

          // Find the arrow polygon (should be outward-pointing by default)
          const polygon = container.querySelector('g polygon');
          expect(polygon).toBeTruthy();

          // Extract polygon points
          const pointsAttr = polygon?.getAttribute('points');
          expect(pointsAttr).toBeTruthy();

          // Parse points
          const points = pointsAttr!.trim().split(/\s+/).map(point => {
            const [x, y] = point.split(',').map(Number);
            return { x, y };
          });

          expect(points.length).toBe(3);

          // Verify the arrow points outward (tip at rim)
          const compassCenter = 120;
          const radius = 100;
          const arrowRimInset = 6;
          const expectedTipY = compassCenter - radius + arrowRimInset;
          const tipY = points[2].y;

          expect(Math.abs(tipY - expectedTipY)).toBeLessThanOrEqual(2);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2.3: arrow line connects correctly from rim inset to arrowhead', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),
        fc.boolean(),
        (direction, arrowInward) => {
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              arrowInward={arrowInward}
            />
          );

          // Find the arrow line element
          const line = container.querySelector('g line');
          expect(line).toBeTruthy();

          // Extract line coordinates
          const x1 = parseFloat(line?.getAttribute('x1') || '0');
          const y1 = parseFloat(line?.getAttribute('y1') || '0');
          const x2 = parseFloat(line?.getAttribute('x2') || '0');
          const y2 = parseFloat(line?.getAttribute('y2') || '0');

          const compassCenter = 120;

          // Verify line is vertical (x1 === x2 === center)
          expect(Math.abs(x1 - compassCenter)).toBeLessThanOrEqual(1);
          expect(Math.abs(x2 - compassCenter)).toBeLessThanOrEqual(1);

          // Verify line connects properly
          // For outward arrow: line goes from center to near rim
          // For inward arrow: line goes from rim inset to near center
          if (arrowInward) {
            expect(y1).toBeLessThan(y2);
          } else {
            expect(y1).toBeLessThanOrEqual(y2);
          }

          // Verify line has proper stroke styling
          expect(line?.getAttribute('stroke')).toBeTruthy();
          expect(line?.getAttribute('stroke-width')).toBe('6');
          expect(line?.getAttribute('stroke-linecap')).toBe('round');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2.4: arrow rotates correctly based on direction prop (0-360 degrees)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),
        fc.boolean(),
        (direction, arrowInward) => {
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              arrowInward={arrowInward}
            />
          );

          // Arrow group uses SVG transform attribute (stable at page zoom / DPR)
          const arrowGroup = container.querySelector('g');
          expect(arrowGroup).toBeTruthy();

          const transform = arrowGroup?.getAttribute('transform');
          expect(transform).toBe(`rotate(${direction} 120 120)`);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2.5: all compass elements (circle, ticks, cardinal labels) display correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),
        fc.boolean(),
        (direction, arrowInward) => {
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              arrowInward={arrowInward}
            />
          );

          // Verify compass circle exists
          const circle = container.querySelector('circle[r="100"]');
          expect(circle).toBeTruthy();
          expect(circle?.getAttribute('cx')).toBe('120');
          expect(circle?.getAttribute('cy')).toBe('120');
          expect(circle?.getAttribute('r')).toBe('100');

          // Verify degree ticks exist (should be 360/15 = 24 ticks)
          const ticks = container.querySelectorAll('line[stroke="#000"]');
          expect(ticks.length).toBe(24);

          // Verify cardinal labels exist (N, NE, E, SE, S, SW, W, NW)
          const labels = container.querySelectorAll('text[font-weight="900"]');
          expect(labels.length).toBe(8);

          // Verify cardinal labels have correct content
          const labelTexts = Array.from(labels).map(label => label.textContent);
          expect(labelTexts).toContain('N');
          expect(labelTexts).toContain('E');
          expect(labelTexts).toContain('S');
          expect(labelTexts).toContain('W');
          expect(labelTexts).toContain('NE');
          expect(labelTexts).toContain('SE');
          expect(labelTexts).toContain('SW');
          expect(labelTexts).toContain('NW');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2.6: interactive dragging setup works when manipulatable=true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),
        fc.boolean(),
        (direction, arrowInward) => {
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              arrowInward={arrowInward}
              manipulatable={true}
              onDirectionChange={() => {}}
            />
          );

          // Verify interactive circle exists for manipulatable compass
          const interactiveCircle = container.querySelector('circle[fill="transparent"]');
          expect(interactiveCircle).toBeTruthy();

          // Verify it has pointer cursor styling
          const style = interactiveCircle?.getAttribute('style');
          expect(style).toContain('pointer');
          expect(style).toContain('pointer-events: all');

          // Manipulatable: touch-action none so pointer drags are not taken over by browser panning
          const svg = container.querySelector('svg');
          const svgStyle = svg?.getAttribute('style');
          expect(svgStyle).toContain('touch-action: none');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2.7: non-manipulatable compass does not have interactive elements', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 360 }),
        fc.boolean(),
        (direction, arrowInward) => {
          const { container } = render(
            <Compass
              direction={direction}
              label="Test Compass"
              arrowInward={arrowInward}
              manipulatable={false}
            />
          );

          // Verify interactive circle does NOT exist for non-manipulatable compass
          const interactiveCircle = container.querySelector('circle[fill="transparent"]');
          expect(interactiveCircle).toBeNull();
        }
      ),
      { numRuns: 30 }
    );
  });
});
