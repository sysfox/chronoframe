import { desc, eq } from 'drizzle-orm'

// Admin endpoint to list all submissions
export default eventHandler(async (event) => {
  await requireUserSession(event)
  
  const db = useDB()
  const query = getQuery(event)
  const status = query.status as 'pending' | 'approved' | 'rejected' | undefined
  
  let submissions
  if (status) {
    submissions = await db
      .select()
      .from(tables.submissions)
      .where(eq(tables.submissions.status, status))
      .orderBy(desc(tables.submissions.createdAt))
      .all()
  } else {
    submissions = await db
      .select()
      .from(tables.submissions)
      .orderBy(desc(tables.submissions.createdAt))
      .all()
  }

  return submissions
})
