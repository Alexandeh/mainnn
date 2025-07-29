import pygame
import sys

# Constants
WIDTH, HEIGHT = 800, 600
FPS = 60

# Colors inspired by Minecraft palette
GREEN = (102, 142, 57)  # grass-like
BROWN = (109, 73, 54)   # dirt-like
GRAY = (67, 67, 67)
WHITE = (255, 255, 255)

BALL_RADIUS = 10


def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Minecraft Pinball")
    clock = pygame.time.Clock()

    ball_pos = [WIDTH // 2, HEIGHT - 30]
    ball_vel = [5, -5]

    # simple rectangular paddle
    paddle = pygame.Rect(WIDTH // 2 - 50, HEIGHT - 20, 100, 10)

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            paddle.x -= 7
        if keys[pygame.K_RIGHT]:
            paddle.x += 7

        paddle.x = max(0, min(WIDTH - paddle.width, paddle.x))

        ball_pos[0] += ball_vel[0]
        ball_pos[1] += ball_vel[1]

        if ball_pos[0] <= BALL_RADIUS or ball_pos[0] >= WIDTH - BALL_RADIUS:
            ball_vel[0] = -ball_vel[0]
        if ball_pos[1] <= BALL_RADIUS:
            ball_vel[1] = -ball_vel[1]

        if paddle.collidepoint(ball_pos[0], ball_pos[1] + BALL_RADIUS):
            ball_vel[1] = -abs(ball_vel[1])

        if ball_pos[1] > HEIGHT:
            ball_pos = [WIDTH // 2, HEIGHT - 30]
            ball_vel = [5, -5]

        screen.fill(GREEN)
        pygame.draw.rect(screen, BROWN, [0, HEIGHT - 50, WIDTH, 50])
        pygame.draw.rect(screen, GRAY, paddle)
        pygame.draw.circle(screen, WHITE, (int(ball_pos[0]), int(ball_pos[1])), BALL_RADIUS)

        pygame.display.flip()
        clock.tick(FPS)

if __name__ == "__main__":
    main()
